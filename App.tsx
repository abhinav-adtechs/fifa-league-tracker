import React, { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CreateTournamentModal,
  type CreateTournamentDraft,
} from "./components/CreateTournamentModal";
import { Dashboard } from "./components/Dashboard";
import { MatchList } from "./components/MatchList";
import { MyPerformance } from "./components/MyPerformance";
import { Standings } from "./components/Standings";
import { TournamentAdminPanel } from "./components/TournamentAdminPanel";
import { TournamentBracket } from "./components/TournamentBracket";
import { TournamentSquad } from "./components/TournamentSquad";
import {
  appendTournamentAdminAudit,
  buildDefaultTournamentAdmins,
  buildSeedTournamentAdmins,
  globalAuth,
  hashPassword,
  reconcilePlatformAdmins,
  verifyTournamentAdmin,
} from "./services/auth";
import { sessionStorage } from "./services/sessionStorage";
import { db } from "./services/storage";
import type {
  Admin,
  Match,
  PlatformState,
  PlayerProfile,
  StandingsView,
  Tournament,
  TournamentFixture,
  TournamentType,
  WorkspaceTab,
} from "./types";
import {
  createKnockoutFixtures,
  createPlatformFromLegacy,
  createPlayerProfile,
  DEFAULT_TOURNAMENT_SETTINGS,
  deleteFixtureResult,
  deriveTournamentPlayers,
  editFixtureResult,
  generateLeagueKnockoutFixtures,
  generateLeagueFixtures,
  getDefaultTrophyImage,
  getEffectiveGroupCount,
  getEffectiveKnockoutQualifierCount,
  getGroupStandings,
  getQualifiedParticipants,
  getPlayerAvatar,
  getReadyFixtures,
  getTournamentProgress,
  getTournamentStatsMatches,
  getTournamentTableMatches,
  isOpenEnded,
  isTournamentBeforeFirstMatch,
  leagueStageStandingsTableOnly,
  normalizeName,
  rebuildTournamentFixturesFromStructure,
  profileToParticipant,
  recordFixtureResult,
  assignLeagueKnockoutParticipantGroupsBeforeFirstMatch,
  reorderTournamentGroupRosterOrderBeforeFirstMatch,
  reorderTournamentParticipantsBeforeFirstMatch,
  shuffleTournamentParticipantOrder,
  recordOpenMatch,
  syncLeagueKnockoutStage,
  supportsBracket,
  supportsTable,
  tournamentTypeLabel,
} from "./utils/tournaments";
import {
  leagueGroupAccentHex,
  leagueGroupCompletedBadgeStyle,
  leagueGroupFixtureAccentStyle,
  leagueGroupReadyCardStyle,
  sortedLeagueGroupNames,
} from "./utils/groupFixtureColors";
import {
  ChevronRight,
  FolderKanban,
  GitBranch,
  History,
  Home,
  KeyRound,
  LayoutDashboard,
  Lock,
  Settings,
  Palette,
  Pencil,
  Plus,
  PlusCircle,
  ShieldCheck,
  SkipForward,
  Swords,
  CheckCircle2,
  Circle,
  Clock,
  TimerReset,
  Trash2,
  Trophy,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";

/** Generic "Round N" is noisy on the Matches tab; keep group, stage, and named rounds (e.g. Final). */
function matchesTabFixtureMetaLine(fixture: TournamentFixture): string {
  const parts: string[] = [];
  if (fixture.groupName) parts.push(fixture.groupName);
  const round = fixture.roundName.trim();
  if (round && !/^Round\s+\d+$/i.test(round)) parts.push(round);
  parts.push(fixture.stage);
  return parts.join(" · ");
}

const TOURNAMENT_SESSION_KEY = "tournament_admin_sessions";
type ThemeKey = "dark" | "light" | "breeze" | "amber";
const THEME_LIST: ThemeKey[] = ["dark", "light", "breeze", "amber"];
const THEME_LABELS: Record<ThemeKey, string> = {
  dark: "Dark",
  light: "Light",
  breeze: "Breeze",
  amber: "Amber",
};

const THEMES: Record<ThemeKey, Record<string, string>> = {
  dark: {
    "--bg": "#050510",
    "--surface-0": "#050510",
    "--surface-1": "#0a0a1a",
    "--surface-2": "#0f0f24",
    "--surface-3": "#15152e",
    "--surface-4": "#1c1c3a",
    "--surface-0-80": "rgba(5,5,16,0.80)",
    "--surface-0-70": "rgba(5,5,16,0.70)",
    "--text-primary": "#EAEAF0",
    "--text-secondary": "#8888A0",
    "--text-muted": "#55556A",
    "--accent": "#00E676",
    "--accent-dim": "#00C853",
    "--accent-2": "#FFD740",
    "--accent-2-dim": "#FFC400",
    "--accent-blue": "#448AFF",
    "--accent-purple": "#7C4DFF",
    "--accent-red": "#FF5252",
    "--accent-orange": "#FF6E40",
    "--glass-bg": "rgba(255,255,255,0.03)",
    "--glass-bg-hover": "rgba(255,255,255,0.04)",
    "--glass-bg-strong": "rgba(255,255,255,0.05)",
    "--glass-border": "rgba(255,255,255,0.06)",
    "--glass-border-hover": "rgba(255,255,255,0.10)",
    "--glass-light": "rgba(255,255,255,0.04)",
    "--glass-medium": "rgba(255,255,255,0.06)",
    "--glass-strong": "rgba(255,255,255,0.08)",
    "--orb-1": "rgba(0,230,118,0.08)",
    "--orb-2": "rgba(124,77,255,0.06)",
    "--gradient-text":
      "linear-gradient(135deg,#00E676,#00C853,#FFD740,#7C4DFF)",
    "--gradient-text-static": "linear-gradient(135deg,#00E676 0%,#FFD740 100%)",
    "--btn-primary-bg": "linear-gradient(135deg,#00E676,#00C853)",
    "--btn-primary-color": "#050510",
    "--btn-primary-glow": "rgba(0,230,118,0.40)",
    "--btn-ghost-bg": "rgba(255,255,255,0.04)",
    "--btn-ghost-border": "rgba(255,255,255,0.06)",
    "--btn-ghost-bg-hover": "rgba(255,255,255,0.08)",
    "--btn-ghost-border-hover": "rgba(255,255,255,0.12)",
    "--gradient-border-c1": "rgba(0,230,118,0.30)",
    "--gradient-border-c2": "rgba(124,77,255,0.30)",
    "--gradient-border-c3": "rgba(255,215,64,0.30)",
    "--tab-active-indicator": "#00E676",
    "--input-focus-border": "rgba(0,230,118,0.40)",
    "--input-focus-shadow": "rgba(0,230,118,0.08)",
    "--modal-overlay-bg": "rgba(5,5,16,0.85)",
    "--modal-content-bg": "rgba(15,15,36,0.98)",
    "--selection-bg": "rgba(0,230,118,0.20)",
    "--card-top-line": "rgba(0,230,118,0.30)",
    "--card-bg": "rgba(255,255,255,0.02)",
    "--card-border": "rgba(255,255,255,0.05)",
    "--card-border-hover": "rgba(255,255,255,0.10)",
    "--table-border": "rgba(255,255,255,0.04)",
    "--table-row-hover": "rgba(255,255,255,0.02)",
    "--tooltip-bg": "rgba(15,15,36,0.95)",
    "--tooltip-border": "rgba(255,255,255,0.08)",
    "--shimmer-mid": "rgba(255,255,255,0.04)",
    "--scrollbar-thumb": "rgba(255,255,255,0.08)",
    "--scrollbar-thumb-hover": "rgba(255,255,255,0.14)",
    "--avatar-border": "rgba(255,255,255,0.06)",
    "--avatar-border-hover": "rgba(0,230,118,0.30)",
  },
  light: {
    "--bg": "#F0F2F8",
    "--surface-0": "#F0F2F8",
    "--surface-1": "#FFFFFF",
    "--surface-2": "#F7F8FC",
    "--surface-3": "#EDF0F8",
    "--surface-4": "#E2E6F0",
    "--surface-0-80": "rgba(240,242,248,0.88)",
    "--surface-0-70": "rgba(240,242,248,0.78)",
    "--text-primary": "#1A1A2E",
    "--text-secondary": "#555577",
    "--text-muted": "#8888AA",
    "--accent": "#059669",
    "--accent-dim": "#047857",
    "--accent-2": "#D97706",
    "--accent-2-dim": "#B45309",
    "--accent-blue": "#2563EB",
    "--accent-purple": "#7C3AED",
    "--accent-red": "#DC2626",
    "--accent-orange": "#EA580C",
    "--glass-bg": "rgba(255,255,255,0.72)",
    "--glass-bg-hover": "rgba(255,255,255,0.88)",
    "--glass-bg-strong": "rgba(255,255,255,0.80)",
    "--glass-border": "rgba(0,0,0,0.08)",
    "--glass-border-hover": "rgba(0,0,0,0.16)",
    "--glass-light": "rgba(255,255,255,0.55)",
    "--glass-medium": "rgba(255,255,255,0.65)",
    "--glass-strong": "rgba(255,255,255,0.75)",
    "--orb-1": "rgba(5,150,105,0.08)",
    "--orb-2": "rgba(124,58,237,0.06)",
    "--gradient-text":
      "linear-gradient(135deg,#059669,#047857,#D97706,#7C3AED)",
    "--gradient-text-static": "linear-gradient(135deg,#059669 0%,#D97706 100%)",
    "--btn-primary-bg": "linear-gradient(135deg,#059669,#047857)",
    "--btn-primary-color": "#FFFFFF",
    "--btn-primary-glow": "rgba(5,150,105,0.35)",
    "--btn-ghost-bg": "rgba(0,0,0,0.04)",
    "--btn-ghost-border": "rgba(0,0,0,0.08)",
    "--btn-ghost-bg-hover": "rgba(0,0,0,0.07)",
    "--btn-ghost-border-hover": "rgba(0,0,0,0.14)",
    "--gradient-border-c1": "rgba(5,150,105,0.30)",
    "--gradient-border-c2": "rgba(124,58,237,0.30)",
    "--gradient-border-c3": "rgba(217,119,6,0.30)",
    "--tab-active-indicator": "#059669",
    "--input-focus-border": "rgba(5,150,105,0.40)",
    "--input-focus-shadow": "rgba(5,150,105,0.08)",
    "--modal-overlay-bg": "rgba(240,242,248,0.88)",
    "--modal-content-bg": "rgba(255,255,255,0.98)",
    "--selection-bg": "rgba(5,150,105,0.15)",
    "--card-top-line": "rgba(5,150,105,0.30)",
    "--card-bg": "rgba(255,255,255,0.75)",
    "--card-border": "rgba(0,0,0,0.07)",
    "--card-border-hover": "rgba(0,0,0,0.14)",
    "--table-border": "rgba(0,0,0,0.06)",
    "--table-row-hover": "rgba(0,0,0,0.03)",
    "--tooltip-bg": "rgba(255,255,255,0.98)",
    "--tooltip-border": "rgba(0,0,0,0.10)",
    "--shimmer-mid": "rgba(0,0,0,0.04)",
    "--scrollbar-thumb": "rgba(0,0,0,0.12)",
    "--scrollbar-thumb-hover": "rgba(0,0,0,0.22)",
    "--avatar-border": "rgba(0,0,0,0.08)",
    "--avatar-border-hover": "rgba(5,150,105,0.40)",
  },
  breeze: {
    "--bg": "#0F1929",
    "--surface-0": "#0F1929",
    "--surface-1": "#152238",
    "--surface-2": "#1B2C47",
    "--surface-3": "#213556",
    "--surface-4": "#274065",
    "--surface-0-80": "rgba(15,25,41,0.85)",
    "--surface-0-70": "rgba(15,25,41,0.75)",
    "--text-primary": "#E8F4FF",
    "--text-secondary": "#7AAACF",
    "--text-muted": "#4A7090",
    "--accent": "#38BDF8",
    "--accent-dim": "#0EA5E9",
    "--accent-2": "#34D399",
    "--accent-2-dim": "#10B981",
    "--accent-blue": "#60A5FA",
    "--accent-purple": "#818CF8",
    "--accent-red": "#F87171",
    "--accent-orange": "#FB923C",
    "--glass-bg": "rgba(56,189,248,0.04)",
    "--glass-bg-hover": "rgba(56,189,248,0.07)",
    "--glass-bg-strong": "rgba(56,189,248,0.06)",
    "--glass-border": "rgba(56,189,248,0.12)",
    "--glass-border-hover": "rgba(56,189,248,0.22)",
    "--glass-light": "rgba(56,189,248,0.04)",
    "--glass-medium": "rgba(56,189,248,0.06)",
    "--glass-strong": "rgba(56,189,248,0.09)",
    "--orb-1": "rgba(56,189,248,0.10)",
    "--orb-2": "rgba(52,211,153,0.07)",
    "--gradient-text":
      "linear-gradient(135deg,#38BDF8,#0EA5E9,#34D399,#818CF8)",
    "--gradient-text-static": "linear-gradient(135deg,#38BDF8 0%,#34D399 100%)",
    "--btn-primary-bg": "linear-gradient(135deg,#38BDF8,#0EA5E9)",
    "--btn-primary-color": "#0F1929",
    "--btn-primary-glow": "rgba(56,189,248,0.40)",
    "--btn-ghost-bg": "rgba(56,189,248,0.05)",
    "--btn-ghost-border": "rgba(56,189,248,0.10)",
    "--btn-ghost-bg-hover": "rgba(56,189,248,0.09)",
    "--btn-ghost-border-hover": "rgba(56,189,248,0.18)",
    "--gradient-border-c1": "rgba(56,189,248,0.30)",
    "--gradient-border-c2": "rgba(129,140,248,0.30)",
    "--gradient-border-c3": "rgba(52,211,153,0.30)",
    "--tab-active-indicator": "#38BDF8",
    "--input-focus-border": "rgba(56,189,248,0.40)",
    "--input-focus-shadow": "rgba(56,189,248,0.10)",
    "--modal-overlay-bg": "rgba(15,25,41,0.88)",
    "--modal-content-bg": "rgba(21,34,56,0.98)",
    "--selection-bg": "rgba(56,189,248,0.20)",
    "--card-top-line": "rgba(56,189,248,0.35)",
    "--card-bg": "rgba(56,189,248,0.03)",
    "--card-border": "rgba(56,189,248,0.09)",
    "--card-border-hover": "rgba(56,189,248,0.18)",
    "--table-border": "rgba(56,189,248,0.07)",
    "--table-row-hover": "rgba(56,189,248,0.03)",
    "--tooltip-bg": "rgba(21,34,56,0.96)",
    "--tooltip-border": "rgba(56,189,248,0.12)",
    "--shimmer-mid": "rgba(56,189,248,0.05)",
    "--scrollbar-thumb": "rgba(56,189,248,0.12)",
    "--scrollbar-thumb-hover": "rgba(56,189,248,0.22)",
    "--avatar-border": "rgba(56,189,248,0.10)",
    "--avatar-border-hover": "rgba(56,189,248,0.40)",
  },
  amber: {
    "--bg": "#120C02",
    "--surface-0": "#120C02",
    "--surface-1": "#1B1203",
    "--surface-2": "#241905",
    "--surface-3": "#2D2007",
    "--surface-4": "#39290A",
    "--surface-0-80": "rgba(18,12,2,0.86)",
    "--surface-0-70": "rgba(18,12,2,0.76)",
    "--text-primary": "#FFF5E6",
    "--text-secondary": "#D4B486",
    "--text-muted": "#8A6B42",
    "--accent": "#FBBF24",
    "--accent-dim": "#F59E0B",
    "--accent-2": "#F97316",
    "--accent-2-dim": "#EA580C",
    "--accent-blue": "#60A5FA",
    "--accent-purple": "#C084FC",
    "--accent-red": "#F87171",
    "--accent-orange": "#FB923C",
    "--glass-bg": "rgba(251,191,36,0.04)",
    "--glass-bg-hover": "rgba(251,191,36,0.07)",
    "--glass-bg-strong": "rgba(251,191,36,0.06)",
    "--glass-border": "rgba(251,191,36,0.12)",
    "--glass-border-hover": "rgba(251,191,36,0.22)",
    "--glass-light": "rgba(251,191,36,0.04)",
    "--glass-medium": "rgba(251,191,36,0.06)",
    "--glass-strong": "rgba(251,191,36,0.09)",
    "--orb-1": "rgba(251,191,36,0.10)",
    "--orb-2": "rgba(249,115,22,0.07)",
    "--gradient-text":
      "linear-gradient(135deg,#FBBF24,#F59E0B,#F97316,#FB923C)",
    "--gradient-text-static": "linear-gradient(135deg,#FBBF24 0%,#F97316 100%)",
    "--btn-primary-bg": "linear-gradient(135deg,#FBBF24,#F59E0B)",
    "--btn-primary-color": "#100A00",
    "--btn-primary-glow": "rgba(251,191,36,0.40)",
    "--btn-ghost-bg": "rgba(251,191,36,0.05)",
    "--btn-ghost-border": "rgba(251,191,36,0.12)",
    "--btn-ghost-bg-hover": "rgba(251,191,36,0.09)",
    "--btn-ghost-border-hover": "rgba(251,191,36,0.20)",
    "--gradient-border-c1": "rgba(251,191,36,0.30)",
    "--gradient-border-c2": "rgba(249,115,22,0.30)",
    "--gradient-border-c3": "rgba(251,146,60,0.30)",
    "--tab-active-indicator": "#FBBF24",
    "--input-focus-border": "rgba(251,191,36,0.40)",
    "--input-focus-shadow": "rgba(251,191,36,0.10)",
    "--modal-overlay-bg": "rgba(16,10,0,0.88)",
    "--modal-content-bg": "rgba(28,18,0,0.98)",
    "--selection-bg": "rgba(251,191,36,0.20)",
    "--card-top-line": "rgba(251,191,36,0.35)",
    "--card-bg": "rgba(251,191,36,0.03)",
    "--card-border": "rgba(251,191,36,0.09)",
    "--card-border-hover": "rgba(251,191,36,0.18)",
    "--table-border": "rgba(251,191,36,0.07)",
    "--table-row-hover": "rgba(251,191,36,0.03)",
    "--tooltip-bg": "rgba(28,18,0,0.96)",
    "--tooltip-border": "rgba(251,191,36,0.12)",
    "--shimmer-mid": "rgba(251,191,36,0.05)",
    "--scrollbar-thumb": "rgba(251,191,36,0.12)",
    "--scrollbar-thumb-hover": "rgba(251,191,36,0.22)",
    "--avatar-border": "rgba(251,191,36,0.10)",
    "--avatar-border-hover": "rgba(251,191,36,0.40)",
  },
};

function applyTheme(key: ThemeKey) {
  const vars = THEMES[key];
  let el = document.getElementById("runtime-theme") as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = "runtime-theme";
    document.head.appendChild(el);
  }
  el.textContent = `:root{${Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";")}}`;
  document.body.style.background = vars["--bg"];
  document.body.style.color = vars["--text-primary"];
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", vars["--bg"]);
  }
}

interface TournamentAdminSessionMap {
  [tournamentId: string]: Admin;
}

function getDefaultWorkspaceTab(tournament: Tournament | null): WorkspaceTab {
  if (!tournament) return "MATCHES";
  if (supportsTable(tournament.type)) return "TABLE";
  if (supportsBracket(tournament.type)) return "BRACKET";
  return "MATCHES";
}

function getWorkspaceTabs(tournament: Tournament): Array<{
  id: WorkspaceTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> {
  const tabs: Array<{
    id: WorkspaceTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [];
  if (supportsTable(tournament.type))
    tabs.push({ id: "TABLE", label: "Table", icon: Trophy });
  if (supportsBracket(tournament.type))
    tabs.push({ id: "BRACKET", label: "Bracket", icon: GitBranch });
  tabs.push({ id: "MATCHES", label: "Matches", icon: History });
  tabs.push({ id: "PERFORMANCE", label: "Performance", icon: User });
  tabs.push({ id: "STATS", label: "Stats", icon: LayoutDashboard });
  tabs.push({ id: "SQUAD", label: "Squad", icon: Users });
  tabs.push({ id: "ADMIN", label: "Settings", icon: Settings });
  return tabs;
}

const App: React.FC = () => {
  const navigate = useNavigate();
  const { tournamentId: urlTournamentId } = useParams<{
    tournamentId?: string;
  }>();
  const [platform, setPlatform] = useState<PlatformState | null>(null);
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(
    null,
  );
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("TABLE");
  const [standingsView, setStandingsView] =
    useState<StandingsView>("NORMALISED");
  const [theme, setTheme] = useState<ThemeKey>(
    () => (localStorage.getItem("app-theme") as ThemeKey) || "dark",
  );
  const [globalAdmin, setGlobalAdmin] = useState<Admin | null>(null);
  const [tournamentSessions, setTournamentSessions] =
    useState<TournamentAdminSessionMap>({});
  const [showGlobalLoginModal, setShowGlobalLoginModal] = useState(false);
  const [showCreateTournamentModal, setShowCreateTournamentModal] =
    useState(false);
  const [showRecordResultModal, setShowRecordResultModal] = useState(false);
  const [editingFixtureId, setEditingFixtureId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [storedPlatform, storedGlobalAdmin, storedSessionsRaw] =
        await Promise.all([
          db.getPlatformState(),
          globalAuth.getCurrentAdmin(),
          sessionStorage.getItem(TOURNAMENT_SESSION_KEY),
        ]);

      let initialPlatform = storedPlatform;
      if (!initialPlatform) {
        const [legacyPlayers, legacyMatches, seededAdmins] = await Promise.all([
          db.getLegacyPlayers(),
          db.getLegacyMatches(),
          buildSeedTournamentAdmins(),
        ]);
        initialPlatform = createPlatformFromLegacy(
          legacyPlayers,
          legacyMatches,
          seededAdmins,
        );
      }

      const reconciledPlatform = await reconcilePlatformAdmins(initialPlatform);
      initialPlatform = {
        ...reconciledPlatform,
        tournaments: reconciledPlatform.tournaments.map((tournament) =>
          syncLeagueKnockoutStage({
            ...tournament,
            settings: {
              ...DEFAULT_TOURNAMENT_SETTINGS,
              ...tournament.settings,
            },
          }),
        ),
      };
      await db.savePlatformState(initialPlatform);

      setPlatform(initialPlatform);
      setGlobalAdmin(storedGlobalAdmin);
      setTournamentSessions(
        storedSessionsRaw ? JSON.parse(storedSessionsRaw) : {},
      );
      setLoading(false);
    };

    load().catch((error) => {
      console.error(error);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  const activeTournament = useMemo(
    () =>
      platform?.tournaments.find(
        (tournament) => tournament.id === activeTournamentId,
      ) ?? null,
    [platform, activeTournamentId],
  );

  const currentTournamentAdmin = activeTournamentId
    ? (tournamentSessions[activeTournamentId] ?? null)
    : null;

  useEffect(() => {
    if (!activeTournament) return;
    const availableTabs = new Set(
      getWorkspaceTabs(activeTournament).map((tab) => tab.id),
    );
    if (!availableTabs.has(workspaceTab)) {
      setWorkspaceTab(getDefaultWorkspaceTab(activeTournament));
    }
  }, [activeTournament, workspaceTab]);

  useEffect(() => {
    if (activeTournament?.type === "LEAGUE_KNOCKOUT") {
      setStandingsView("TABLE");
    }
  }, [activeTournament?.id, activeTournament?.type]);

  const persistTournamentSessions = async (
    sessions: TournamentAdminSessionMap,
  ) => {
    setTournamentSessions(sessions);
    await sessionStorage.setItem(
      TOURNAMENT_SESSION_KEY,
      JSON.stringify(sessions),
    );
  };

  const commitPlatform = (
    updater: (current: PlatformState) => PlatformState,
  ) => {
    setPlatform((current) => {
      if (!current) return current;
      const next = updater(current);
      db.savePlatformState(next).catch(console.error);
      return next;
    });
  };

  useEffect(() => {
    if (!platform) return;

    if (urlTournamentId) {
      const exists = platform.tournaments.some(
        (t) => t.id === urlTournamentId,
      );
      if (!exists) {
        navigate("/", { replace: true });
        return;
      }
      setActiveTournamentId((prev) =>
        prev === urlTournamentId ? prev : urlTournamentId,
      );
      commitPlatform((current) => {
        if (current.lastOpenedTournamentId === urlTournamentId) {
          return current;
        }
        return { ...current, lastOpenedTournamentId: urlTournamentId };
      });
    } else {
      const fallback =
        platform.lastOpenedTournamentId ??
        platform.tournaments[0]?.id ??
        null;
      setActiveTournamentId((prev) => (prev === fallback ? prev : fallback));
    }
  }, [platform, urlTournamentId, navigate]);

  const openTournament = (tournamentId: string) => {
    const targetTournament =
      platform?.tournaments.find(
        (tournament) => tournament.id === tournamentId,
      ) ?? null;
    setWorkspaceTab(getDefaultWorkspaceTab(targetTournament));
    navigate(`/t/${tournamentId}`);
  };

  const updateActiveTournament = (
    updater: (tournament: Tournament) => Tournament,
  ) => {
    if (!activeTournamentId) return;

    commitPlatform((current) => ({
      ...current,
      tournaments: current.tournaments.map((tournament) =>
        tournament.id === activeTournamentId
          ? syncLeagueKnockoutStage(updater(tournament))
          : tournament,
      ),
    }));
  };

  const allPlayers = useMemo(
    () =>
      activeTournament
        ? deriveTournamentPlayers(
            activeTournament,
            getTournamentStatsMatches(activeTournament),
          )
        : [],
    [activeTournament],
  );
  const tablePlayers = useMemo(
    () =>
      activeTournament
        ? deriveTournamentPlayers(
            activeTournament,
            getTournamentTableMatches(activeTournament),
          )
        : [],
    [activeTournament],
  );
  const groupedStandings = useMemo(
    () => (activeTournament ? getGroupStandings(activeTournament) : []),
    [activeTournament],
  );
  const leagueKnockoutStandingsMeta = useMemo(() => {
    if (!activeTournament || activeTournament.type !== "LEAGUE_KNOCKOUT") {
      return undefined;
    }
    const slots = getEffectiveKnockoutQualifierCount(activeTournament);
    const qualifiedIds = new Set(
      getQualifiedParticipants(activeTournament).map((p) => p.id),
    );
    const multiGroup =
      getEffectiveGroupCount(
        activeTournament.participants.length,
        activeTournament.settings.groupCount ?? 1,
      ) > 1;
    return { slots, qualifiedIds, multiGroup };
  }, [activeTournament]);
  const leagueTableStandingsOnly =
    activeTournament != null &&
    leagueStageStandingsTableOnly(activeTournament.type);
  const progress = activeTournament
    ? getTournamentProgress(activeTournament)
    : null;
  const readyFixtures = activeTournament
    ? getReadyFixtures(activeTournament)
    : [];
  const workspaceTabs = activeTournament
    ? getWorkspaceTabs(activeTournament)
    : [];
  const cycleTheme = () => {
    const idx = THEME_LIST.indexOf(theme);
    setTheme(THEME_LIST[(idx + 1) % THEME_LIST.length]);
  };

  const handleGlobalLogin = async (password: string) => {
    const result = await globalAuth.login(password);
    if (result.success && result.admin) {
      setGlobalAdmin(result.admin);
      setShowGlobalLoginModal(false);
    } else {
      throw new Error(result.error || "Global admin login failed");
    }
  };

  const handleGlobalLogout = async () => {
    await globalAuth.logout();
    setGlobalAdmin(null);
  };

  const handleCreateTournament = async (draft: CreateTournamentDraft) => {
    if (!platform) return;

    const playerPool = [...platform.playerPool];
    const guestProfiles: PlayerProfile[] = [];

    for (const guest of draft.guests) {
      if (!guest.name.trim()) continue;
      const existing = playerPool.find(
        (profile) => normalizeName(profile.name) === normalizeName(guest.name),
      );
      if (existing) {
        guestProfiles.push(existing);
        continue;
      }
      const profile = createPlayerProfile(guest.name);
      guestProfiles.push(profile);
      playerPool.push(profile);
    }

    const selectedProfiles = draft.entries
      .map((entry) =>
        playerPool.find((profile) => profile.id === entry.profileId),
      )
      .filter(Boolean) as PlayerProfile[];

    let participants = [
      ...draft.entries.map((entry, index) => {
        const profile = selectedProfiles.find(
          (candidate) => candidate.id === entry.profileId,
        );
        return profile
          ? profileToParticipant(profile, entry.teamName, index + 1)
          : null;
      }),
      ...draft.guests.map((guest, index) => {
        const profile = guestProfiles.find(
          (candidate) =>
            normalizeName(candidate.name) === normalizeName(guest.name),
        );
        return profile
          ? profileToParticipant(
              profile,
              guest.teamName,
              draft.entries.length + index + 1,
            )
          : null;
      }),
    ].filter(Boolean) as Tournament["participants"];

    if (participants.length < 2) {
      alert("Add at least two participants to create a tournament.");
      return;
    }

    const admins = await buildDefaultTournamentAdmins();

    const leagueKnockoutSetup =
      draft.type === "LEAGUE_KNOCKOUT"
        ? generateLeagueKnockoutFixtures(
            participants,
            draft.settings.matchesPerOpponent,
            draft.settings.groupCount,
          )
        : null;

    if (leagueKnockoutSetup) {
      participants = leagueKnockoutSetup.participants;
    }

    const tournament: Tournament = {
      id: crypto.randomUUID(),
      name: draft.name.trim(),
      type: draft.type,
      targetPlayerCount: Math.max(2, draft.targetPlayerCount),
      trophyImage: draft.trophyImage,
      participants,
      matches: [],
      fixtures:
        draft.type === "LEAGUE"
          ? generateLeagueFixtures(
              participants,
              draft.settings.matchesPerOpponent,
            )
          : draft.type === "KNOCKOUT"
            ? createKnockoutFixtures(
                participants.map((participant) => participant.id),
              )
            : draft.type === "LEAGUE_KNOCKOUT"
              ? (leagueKnockoutSetup?.fixtures ?? [])
              : [],
      admins,
      adminAudit: [],
      settings: draft.settings,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const nextPlatform: PlatformState = {
      ...platform,
      playerPool,
      tournaments: [tournament, ...platform.tournaments],
      lastOpenedTournamentId: tournament.id,
    };

    setPlatform(nextPlatform);
    await db.savePlatformState(nextPlatform);
    setWorkspaceTab(getDefaultWorkspaceTab(tournament));
    setShowCreateTournamentModal(false);
    navigate(`/t/${tournament.id}`);
  };

  const handleTournamentLogin = async (adminName: string, password: string) => {
    if (!activeTournament)
      return { success: false, error: "No active tournament" };

    const matchedAdmin = await verifyTournamentAdmin(
      activeTournament,
      adminName,
      password,
    );
    const nextTournament = appendTournamentAdminAudit(activeTournament, {
      adminId: matchedAdmin?.id ?? null,
      adminNameSnapshot: adminName || "UNKNOWN",
      success: Boolean(matchedAdmin),
    });

    updateActiveTournament(() => nextTournament);

    if (!matchedAdmin) {
      return { success: false, error: "Invalid tournament admin credentials" };
    }

    const sessions = {
      ...tournamentSessions,
      [activeTournament.id]: { id: matchedAdmin.id, name: matchedAdmin.name },
    };
    await persistTournamentSessions(sessions);
    return { success: true };
  };

  const handleTournamentLogout = async () => {
    if (!activeTournament) return;
    const sessions = { ...tournamentSessions };
    delete sessions[activeTournament.id];
    await persistTournamentSessions(sessions);
  };

  const handleApplyTournamentStructure = (draft: {
    type: TournamentType;
    targetPlayerCount: number;
    matchesPerOpponent: number;
    groupCount: number;
    qualifierCount: number;
  }): boolean => {
    if (!activeTournamentId) return false;

    let didApply = false;
    commitPlatform((current) => {
      if (!current) return current;
      const tournament = current.tournaments.find(
        (t) => t.id === activeTournamentId,
      );
      if (!tournament || tournament.matches.length > 0) {
        return current;
      }

      const baseSettings = {
        ...DEFAULT_TOURNAMENT_SETTINGS,
        ...tournament.settings,
      };

      const n = tournament.participants.length;
      const safeMpo = Math.max(
        1,
        Math.min(99, Math.floor(Number(draft.matchesPerOpponent)) || 1),
      );
      const rawGroupRequest = Math.max(
        1,
        Math.floor(Number(draft.groupCount)) || 1,
      );
      const safeQualifierRequest = Math.max(
        2,
        Math.floor(Number(draft.qualifierCount)) || 2,
      );

      const effectiveGroups =
        draft.type === "LEAGUE_KNOCKOUT"
          ? getEffectiveGroupCount(n, rawGroupRequest)
          : 1;

      const nextSettings = {
        ...baseSettings,
        matchesPerOpponent: safeMpo,
        groupCount: effectiveGroups,
        qualifierCount:
          draft.type === "LEAGUE_KNOCKOUT"
            ? Math.max(
                effectiveGroups,
                Math.min(safeQualifierRequest, n || safeQualifierRequest),
              )
            : Math.max(
                2,
                Math.min(safeQualifierRequest, n || safeQualifierRequest),
              ),
      };

      const safeTarget = Math.max(
        2,
        Math.min(999, Math.floor(Number(draft.targetPlayerCount)) || 2),
      );

      const next: Tournament = {
        ...tournament,
        type: draft.type,
        targetPlayerCount: safeTarget,
        settings: nextSettings,
        updatedAt: Date.now(),
      };

      const rebuilt = rebuildTournamentFixturesFromStructure(next, {
        regroupLeagueKnockout: draft.type === "LEAGUE_KNOCKOUT",
      });
      didApply = true;
      return {
        ...current,
        tournaments: current.tournaments.map((t) =>
          t.id === activeTournamentId
            ? syncLeagueKnockoutStage(rebuilt)
            : t,
        ),
      };
    });

    return didApply;
  };

  const handleAddTournamentAdmin = async (name: string, password: string) => {
    const passwordHash = await hashPassword(password);
    updateActiveTournament((tournament) => ({
      ...tournament,
      admins: [
        ...tournament.admins,
        {
          id: crypto.randomUUID(),
          name,
          passwordHash,
          createdAt: Date.now(),
        },
      ],
      updatedAt: Date.now(),
    }));
  };

  const handleDeleteTournament = async () => {
    if (!platform || !activeTournamentId) return;
    const deletedId = activeTournamentId;
    const deletedTournament = platform.tournaments.find(
      (t) => t.id === deletedId,
    );
    if (!deletedTournament) return;

    const remaining = platform.tournaments.filter((t) => t.id !== deletedId);
    const deletedProfileIds = new Set(
      deletedTournament.participants.map((p) => p.profileId),
    );
    const stillUsedProfileIds = new Set<string>();
    for (const t of remaining) {
      for (const p of t.participants) {
        stillUsedProfileIds.add(p.profileId);
      }
    }
    const nextPlayerPool = platform.playerPool.filter(
      (profile) =>
        !deletedProfileIds.has(profile.id) ||
        stillUsedProfileIds.has(profile.id),
    );

    const sessions = { ...tournamentSessions };
    delete sessions[deletedId];
    await persistTournamentSessions(sessions);

    const nextLastOpenedId = remaining[0]?.id ?? null;
    const nextPlatform: PlatformState = {
      ...platform,
      tournaments: remaining,
      playerPool: nextPlayerPool,
      lastOpenedTournamentId: nextLastOpenedId,
    };

    setPlatform(nextPlatform);
    await db.savePlatformState(nextPlatform);

    if (remaining.length === 0) {
      navigate("/");
    } else {
      const nextTournament =
        remaining.find((t) => t.id === nextLastOpenedId) ?? remaining[0];
      setWorkspaceTab(getDefaultWorkspaceTab(nextTournament));
      navigate(`/t/${nextLastOpenedId}`);
    }
  };

  const handleCreatePoolPlayer = (name: string) => {
    if (!platform) return;
    if (
      platform.playerPool.some(
        (profile) => normalizeName(profile.name) === normalizeName(name),
      )
    )
      return;

    const profile = {
      id: crypto.randomUUID(),
      name: name.trim(),
      avatarUrl: getPlayerAvatar(name.trim()),
      createdAt: Date.now(),
    };

    commitPlatform((current) => ({
      ...current,
      playerPool: [...current.playerPool, profile],
    }));
  };

  const handleAddParticipant = (
    profileId: string,
    teamName: string,
  ): boolean => {
    if (!activeTournamentId || !profileId || !teamName.trim()) return false;
    if (
      activeTournament &&
      !isOpenEnded(activeTournament.type) &&
      activeTournament.matches.length > 0
    ) {
      alert(
        "Players cannot be added after the first match has been recorded.",
      );
      return false;
    }

    let added = false;
    commitPlatform((current) => {
      if (!current) return current;
      const tournament = current.tournaments.find(
        (t) => t.id === activeTournamentId,
      );
      if (!tournament) return current;
      if (!isOpenEnded(tournament.type) && tournament.matches.length > 0) {
        return current;
      }
      if (tournament.participants.some((p) => p.profileId === profileId)) {
        return current;
      }
      const profile = current.playerPool.find((item) => item.id === profileId);
      if (!profile) return current;

      let next: Tournament = {
        ...tournament,
        participants: [
          ...tournament.participants,
          profileToParticipant(
            profile,
            teamName.trim(),
            tournament.participants.length + 1,
          ),
        ],
        updatedAt: Date.now(),
      };

      if (!isOpenEnded(next.type) && next.matches.length === 0) {
        next = rebuildTournamentFixturesFromStructure(next);
      }

      added = true;
      return {
        ...current,
        tournaments: current.tournaments.map((t) =>
          t.id === activeTournamentId ? syncLeagueKnockoutStage(next) : t,
        ),
      };
    });

    return added;
  };

  const handleUpdateParticipantTeam = (
    participantId: string,
    teamName: string,
  ) => {
    updateActiveTournament((tournament) => ({
      ...tournament,
      participants: tournament.participants.map((participant) =>
        participant.id === participantId
          ? {
              ...participant,
              teamName: teamName.trim() || participant.teamName,
            }
          : participant,
      ),
      updatedAt: Date.now(),
    }));
  };

  const handleRemoveParticipant = (participantId: string) => {
    if (!activeTournament) return;
    const hasMatchUsage = activeTournament.matches.some(
      (match) =>
        match.player1Id === participantId ||
        match.player2Id === participantId,
    );

    if (hasMatchUsage) {
      alert(
        "This player already has recorded matches and cannot be removed.",
      );
      return;
    }

    updateActiveTournament((tournament) => {
      let next: Tournament = {
        ...tournament,
        participants: tournament.participants.filter(
          (participant) => participant.id !== participantId,
        ),
        updatedAt: Date.now(),
      };

      if (!isOpenEnded(next.type) && next.matches.length === 0) {
        next = rebuildTournamentFixturesFromStructure(next);
      }

      return next;
    });
  };

  const handleAddGuestToTournament = (
    guestName: string,
    teamName: string,
  ): boolean => {
    if (!activeTournamentId) return false;
    const trimmedName = guestName.trim();
    const trimmedTeam = teamName.trim();
    if (!trimmedName || !trimmedTeam) return false;

    let didAdd = false;
    commitPlatform((current) => {
      if (!current) return current;
      const tournament = current.tournaments.find(
        (t) => t.id === activeTournamentId,
      );
      if (!tournament) return current;
      if (!isOpenEnded(tournament.type) && tournament.matches.length > 0) {
        return current;
      }

      const pool = [...current.playerPool];
      let profile = pool.find(
        (p) => normalizeName(p.name) === normalizeName(trimmedName),
      );
      if (!profile) {
        profile = createPlayerProfile(trimmedName);
        pool.push(profile);
      }
      if (tournament.participants.some((p) => p.profileId === profile.id)) {
        return current;
      }

      let next: Tournament = {
        ...tournament,
        participants: [
          ...tournament.participants,
          profileToParticipant(
            profile,
            trimmedTeam,
            tournament.participants.length + 1,
          ),
        ],
        updatedAt: Date.now(),
      };
      if (!isOpenEnded(next.type) && next.matches.length === 0) {
        next = rebuildTournamentFixturesFromStructure(next);
      }
      didAdd = true;
      return {
        ...current,
        playerPool: pool,
        tournaments: current.tournaments.map((t) =>
          t.id === activeTournamentId ? syncLeagueKnockoutStage(next) : t,
        ),
      };
    });
    return didAdd;
  };

  const handleShuffleParticipants = (): boolean => {
    if (!activeTournamentId) return false;
    let ok = false;
    commitPlatform((current) => {
      if (!current) return current;
      const tournament = current.tournaments.find(
        (t) => t.id === activeTournamentId,
      );
      if (!tournament || tournament.matches.length > 0) {
        return current;
      }
      if (tournament.participants.length < 2) {
        return current;
      }

      const shuffled = shuffleTournamentParticipantOrder(
        tournament.participants,
      );
      let next: Tournament = {
        ...tournament,
        participants: shuffled,
        updatedAt: Date.now(),
      };
      if (!isOpenEnded(next.type)) {
        next = rebuildTournamentFixturesFromStructure(next);
      }
      ok = true;
      return {
        ...current,
        tournaments: current.tournaments.map((t) =>
          t.id === activeTournamentId ? syncLeagueKnockoutStage(next) : t,
        ),
      };
    });
    return ok;
  };

  const handleReorderScheduleOrder = (
    orderedParticipantIds: string[],
    groupName?: string,
  ): boolean => {
    if (!activeTournamentId) return false;
    let ok = false;
    commitPlatform((current) => {
      if (!current) return current;
      const tournament = current.tournaments.find(
        (t) => t.id === activeTournamentId,
      );
      if (!tournament || tournament.matches.length > 0) {
        return current;
      }

      const next = groupName
        ? reorderTournamentGroupRosterOrderBeforeFirstMatch(
            tournament,
            groupName,
            orderedParticipantIds,
          )
        : reorderTournamentParticipantsBeforeFirstMatch(
            tournament,
            orderedParticipantIds,
          );

      if (!next) return current;
      ok = true;
      return {
        ...current,
        tournaments: current.tournaments.map((t) =>
          t.id === activeTournamentId ? syncLeagueKnockoutStage(next) : t,
        ),
      };
    });
    return ok;
  };

  const handleAssignLeagueKnockoutGroups = (
    groupByParticipantId: Record<string, string>,
  ): boolean => {
    if (!activeTournamentId) return false;
    let ok = false;
    commitPlatform((current) => {
      if (!current) return current;
      const tournament = current.tournaments.find(
        (t) => t.id === activeTournamentId,
      );
      if (!tournament || tournament.matches.length > 0) {
        return current;
      }

      const next = assignLeagueKnockoutParticipantGroupsBeforeFirstMatch(
        tournament,
        groupByParticipantId,
      );
      if (!next) return current;
      ok = true;
      return {
        ...current,
        tournaments: current.tournaments.map((t) =>
          t.id === activeTournamentId ? syncLeagueKnockoutStage(next) : t,
        ),
      };
    });
    return ok;
  };

  const handleRecordOpenMatch = (
    player1Id: string,
    player2Id: string,
    score1: number,
    score2: number,
  ) => {
    if (!currentTournamentAdmin) {
      alert("Tournament admin access required. Please login first.");
      setWorkspaceTab("ADMIN");
      setEditingFixtureId(null);
      setShowRecordResultModal(false);
      return;
    }
    updateActiveTournament((tournament) =>
      recordOpenMatch(tournament, player1Id, player2Id, score1, score2),
    );
    setEditingFixtureId(null);
    setShowRecordResultModal(false);
  };

  const handleRecordFixtureResult = (
    fixtureId: string,
    score1: number,
    score2: number,
  ) => {
    if (!currentTournamentAdmin) {
      alert("Tournament admin access required. Please login first.");
      setWorkspaceTab("ADMIN");
      setEditingFixtureId(null);
      setShowRecordResultModal(false);
      return;
    }
    try {
      updateActiveTournament((tournament) =>
        recordFixtureResult(tournament, fixtureId, score1, score2),
      );
      setEditingFixtureId(null);
      setShowRecordResultModal(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to save result.");
    }
  };

  const handleEditFixtureResult = (
    fixtureId: string,
    score1: number,
    score2: number,
  ) => {
    if (!currentTournamentAdmin) {
      alert("Tournament admin access required. Please login first.");
      setWorkspaceTab("ADMIN");
      setEditingFixtureId(null);
      setShowRecordResultModal(false);
      return;
    }

    try {
      updateActiveTournament((tournament) =>
        editFixtureResult(tournament, fixtureId, score1, score2),
      );
      setEditingFixtureId(null);
      setShowRecordResultModal(false);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Unable to update result.",
      );
    }
  };

  const handleDeleteFixtureResult = (fixtureId: string) => {
    if (!currentTournamentAdmin) {
      alert("Tournament admin access required. Please login first.");
      setWorkspaceTab("ADMIN");
      return;
    }

    if (!confirm("Delete this recorded result?")) {
      return;
    }

    try {
      updateActiveTournament((tournament) =>
        deleteFixtureResult(tournament, fixtureId),
      );
      if (editingFixtureId === fixtureId) {
        setEditingFixtureId(null);
        setShowRecordResultModal(false);
      }
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Unable to delete result.",
      );
    }
  };

  const renderMatchesTab = () => {
    if (!activeTournament) return null;
    const visibleFixtures = [...activeTournament.fixtures]
      .filter(
        (fixture) =>
          fixture.stage !== "KNOCKOUT" ||
          fixture.status !== "PENDING" ||
          Boolean(fixture.matchId),
      )
      .sort(
        (a, b) => a.roundIndex - b.roundIndex || a.matchIndex - b.matchIndex,
      );

    const leagueGroupOrder = sortedLeagueGroupNames(visibleFixtures);

    return (
      <div className="space-y-6">
        {!isOpenEnded(activeTournament.type) && (
          <div className="glass-card overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-glass-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center">
                <TimerReset className="w-4 h-4 text-accent-gold" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  Fixtures
                </h3>
                <p className="text-[10px] text-text-muted">
                  Pending and completed tournament schedule
                </p>
              </div>
            </div>
            <div className="p-3 sm:p-4 space-y-2">
              {visibleFixtures.length === 0 ? (
                <div className="text-sm text-text-muted py-6 text-center">
                  No fixtures generated yet.
                </div>
              ) : (
                visibleFixtures.map((fixture, gameIndex) => {
                  const participant1 = activeTournament.participants.find(
                    (participant) => participant.id === fixture.participant1Id,
                  );
                  const participant2 = activeTournament.participants.find(
                    (participant) => participant.id === fixture.participant2Id,
                  );
                  const fixtureMatch = activeTournament.matches.find(
                    (match) => match.fixtureId === fixture.id,
                  );

                  const isCompleted = Boolean(fixtureMatch);
                  const isReady = fixture.status === "READY" && !isCompleted;
                  const isBye = fixture.status === "BYE";
                  const isPending = !isCompleted && !isReady && !isBye;

                  const groupHex = leagueGroupAccentHex(
                    fixture,
                    leagueGroupOrder,
                  );
                  const readyUsesGroupColor = Boolean(groupHex && isReady);

                  const cardClasses = readyUsesGroupColor
                    ? "p-3 rounded-xl"
                    : isReady
                      ? "p-3 rounded-xl border border-accent-green/30 bg-accent-green/5 shadow-[0_0_12px_-4px_rgba(0,230,118,0.15)]"
                      : isBye
                        ? "p-3 rounded-xl border border-dashed border-accent-purple/20 bg-accent-purple/5"
                        : isPending
                          ? "p-3 rounded-xl border border-dashed border-glass-border bg-glass-light opacity-50"
                          : "p-3 rounded-xl border border-glass-border bg-glass-light";

                  const cardStyle: CSSProperties =
                    readyUsesGroupColor && groupHex
                      ? leagueGroupReadyCardStyle(groupHex)
                      : leagueGroupFixtureAccentStyle(
                            fixture,
                            leagueGroupOrder,
                          ) ?? {};

                  const completedUsesGroupBadge = Boolean(
                    groupHex && isCompleted,
                  );

                  return (
                    <div
                      key={fixture.id}
                      style={cardStyle}
                      className={`${cardClasses} flex flex-col sm:flex-row sm:items-center gap-3`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                          <span className="font-mono text-text-secondary tabular-nums">
                            Game #{gameIndex + 1}
                          </span>
                          <span className="text-text-muted"> · </span>
                          {matchesTabFixtureMetaLine(fixture)}
                        </div>
                        <div className="text-sm font-semibold text-text-primary truncate">
                          {participant1?.name ?? "TBD"} vs{" "}
                          {participant2?.name ?? "TBD"}
                        </div>
                        <div className="text-[11px] text-text-muted mt-1">
                          {participant1?.teamName ?? "Waiting"} vs{" "}
                          {participant2?.teamName ?? "Waiting"}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 shrink-0 sm:ml-auto">
                        {fixtureMatch && (
                          <div className="text-base font-bold font-mono text-text-primary">
                            {fixtureMatch.score1} - {fixtureMatch.score2}
                          </div>
                        )}
                        <div
                          className={`inline-flex items-center justify-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider whitespace-nowrap ${
                            completedUsesGroupBadge
                              ? ""
                              : isCompleted
                                ? "bg-accent-green/10 text-accent-green border border-accent-green/15"
                                : isReady
                                  ? "bg-accent-gold/10 text-accent-gold border border-accent-gold/15"
                                  : isBye
                                    ? "bg-accent-purple/10 text-accent-purple border border-accent-purple/15"
                                    : "bg-glass-light text-text-muted border border-glass-border"
                          }`}
                          style={
                            completedUsesGroupBadge && groupHex
                              ? leagueGroupCompletedBadgeStyle(groupHex)
                              : undefined
                          }
                        >
                          {isCompleted && (
                            <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                          )}
                          {isReady && (
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                          )}
                          {isBye && (
                            <SkipForward className="w-2.5 h-2.5 shrink-0" />
                          )}
                          {isPending && (
                            <Circle className="w-2.5 h-2.5 shrink-0" />
                          )}
                          {isCompleted
                            ? "Completed"
                            : isReady
                              ? "Ready"
                              : isBye
                                ? "Bye"
                                : "Pending"}
                        </div>
                        {currentTournamentAdmin && isReady && !fixtureMatch && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFixtureId(null);
                              setShowRecordResultModal(true);
                            }}
                            className="btn-primary px-3 py-2 text-xs flex items-center gap-1.5"
                          >
                            <PlusCircle className="w-3.5 h-3.5" /> Record
                          </button>
                        )}
                        {fixtureMatch && currentTournamentAdmin && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingFixtureId(fixture.id);
                                setShowRecordResultModal(true);
                              }}
                              className="btn-ghost p-2 rounded-xl"
                              title="Edit Result"
                              aria-label="Edit Result"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteFixtureResult(fixture.id)
                              }
                              className="p-2 rounded-xl border border-accent-red/20 bg-accent-red/10 text-accent-red transition-colors hover:bg-accent-red/15"
                              title="Delete Result"
                              aria-label="Delete Result"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        <MatchList matches={activeTournament.matches} players={allPlayers} />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-secondary">
        <div className="glass-card px-6 py-5 text-sm font-semibold">
          Loading tournament platform...
        </div>
      </div>
    );
  }

  if (!platform) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-secondary">
        <div className="glass-card px-6 py-5 text-sm font-semibold">
          Unable to load tournament data.
        </div>
      </div>
    );
  }

  const tournamentFromUrl = urlTournamentId
    ? platform.tournaments.find((t) => t.id === urlTournamentId)
    : null;

  if (urlTournamentId) {
    if (!tournamentFromUrl || activeTournament?.id !== urlTournamentId) {
      return (
        <div className="min-h-screen flex items-center justify-center text-text-secondary">
          <div className="glass-card px-6 py-5 text-sm font-semibold">
            Opening tournament…
          </div>
        </div>
      );
    }
  } else if (platform.tournaments.length > 0 && !activeTournament) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-secondary">
        <div className="glass-card px-6 py-5 text-sm font-semibold">
          Loading tournament platform...
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen">
      <header className="sticky top-0 z-50">
        <div className="absolute inset-0 bg-surface-0/80 backdrop-blur-xl border-b border-glass-border"></div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-9 h-9 rounded-xl bg-glass-medium border border-glass-border flex items-center justify-center overflow-hidden shrink-0">
                <img src="/fc26-logo.svg" alt="FC26" className="w-7 h-7" />
                <div className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-accent-2/90 border border-surface-0 flex items-center justify-center">
                  <Trophy className="w-2.5 h-2.5 text-surface-0" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-mono uppercase tracking-widest text-text-muted">
                  Tournament Platform
                </div>
                <div className="text-sm sm:text-base font-bold text-text-primary truncate">
                  {activeTournament?.name ?? "Tournament Hub"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={cycleTheme}
                title={`Theme: ${THEME_LABELS[theme]} — click to cycle`}
                className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 group"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                <Palette
                  className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-12"
                  style={{ color: "var(--accent)" }}
                />
                <span
                  className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                  style={{ color: "var(--text-muted)" }}
                >
                  {THEME_LABELS[theme]}
                </span>
              </button>
              {urlTournamentId ? (
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="btn-ghost flex items-center gap-2 text-xs sm:text-sm"
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Tournaments</span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  if (!currentTournamentAdmin) {
                    alert(
                      "Tournament admin access required. Please login first.",
                    );
                    setWorkspaceTab("ADMIN");
                    return;
                  }
                  setEditingFixtureId(null);
                  setShowRecordResultModal(true);
                }}
                disabled={
                  !activeTournament ||
                  !currentTournamentAdmin ||
                  (isOpenEnded(activeTournament.type)
                    ? activeTournament.participants.length < 2
                    : readyFixtures.length === 0)
                }
                className="btn-primary flex items-center gap-2 text-xs sm:text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Record Result</span>
                <span className="sm:hidden">Result</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-glass-border">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-0 via-surface-1/50 to-surface-0"></div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          {activeTournament ? (
            <>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={
                        activeTournament.trophyImage || getDefaultTrophyImage()
                      }
                      alt={`${activeTournament.name} trophy`}
                      className="w-14 h-16 sm:w-16 sm:h-20 object-contain shrink-0 drop-shadow-[0_12px_24px_rgba(0,0,0,0.18)]"
                    />
                    <span className="text-[11px] font-mono font-medium text-accent-green uppercase tracking-widest">
                      {tournamentTypeLabel(activeTournament.type)}
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary leading-[1.1]">
                    {activeTournament.name}
                  </h1>
                  <p className="mt-3 text-sm text-text-secondary max-w-2xl leading-relaxed">
                    {isOpenEnded(activeTournament.type)
                      ? "This is an open-ended league. Results can be recorded at any time and the table updates live without fixtures."
                      : `Tournament schedule, fixtures, and progress are scoped to this workspace. ${activeTournament.participants.length} players are currently registered.`}
                  </p>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 min-w-0 lg:min-w-[420px]">
                  <StatCard
                    label="Players"
                    value={String(activeTournament.participants.length)}
                    icon={Users}
                  />
                  <StatCard
                    label="Matches"
                    value={String(activeTournament.matches.length)}
                    icon={Swords}
                  />
                  {progress ? (
                    <StatCard
                      label="Games Left"
                      value={String(progress.remainingMatches)}
                      icon={TimerReset}
                    />
                  ) : (
                    <StatCard label="Mode" value="Open" icon={FolderKanban} />
                  )}
                </div>
              </div>

              {progress ? (
                <div className="glass-card mt-6 p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        Tournament Progress
                      </div>
                      <div className="text-lg font-bold text-text-primary">
                        {progress.completionPercent}% complete
                      </div>
                    </div>
                    <div className="text-sm text-text-secondary">
                      {progress.remainingMatches} matches left
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-glass-light overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${progress.completionPercent}%`,
                        background:
                          "linear-gradient(135deg, var(--accent), var(--accent-2))",
                      }}
                    />
                  </div>
                  <div className="text-[11px] text-text-muted mt-2">
                    League and knockout progress update automatically as results
                    come in.
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-center py-4 sm:py-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
                Tournament Hub
              </h1>
              <p className="mt-2 text-sm text-text-secondary max-w-md mx-auto">
                Create a tournament from the list below to start tracking
                fixtures and standings.
              </p>
            </div>
          )}
        </div>
      </section>

      {!urlTournamentId ? (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <PlatformHome
            tournaments={platform.tournaments}
            activeTournamentId={activeTournamentId}
            globalAdmin={globalAdmin}
            onOpenTournament={openTournament}
            onOpenCreate={() =>
              globalAdmin
                ? setShowCreateTournamentModal(true)
                : setShowGlobalLoginModal(true)
            }
            onGlobalLogin={() => setShowGlobalLoginModal(true)}
            onGlobalLogout={handleGlobalLogout}
          />
        </main>
      ) : (
        <>
          <nav className="sticky top-14 sm:top-16 z-40">
            <div className="absolute inset-0 bg-surface-0/70 backdrop-blur-xl"></div>
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-none border-b border-glass-border">
                {workspaceTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setWorkspaceTab(tab.id)}
                    className={`tab-item ${workspaceTab === tab.id ? "active" : ""}`}
                  >
                    <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </nav>

          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
            {workspaceTab === "TABLE" &&
              supportsTable(activeTournament.type) &&
              (activeTournament.type === "LEAGUE_KNOCKOUT" &&
              groupedStandings.length > 1 ? (
                <div className="space-y-6">
                  {groupedStandings.map((group, index) => (
                    <div key={group.groupName} className="space-y-3">
                      <div className="glass-card p-4 sm:p-5">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                          League Group
                        </div>
                        <div className="text-lg font-bold text-text-primary mt-1">
                          {group.groupName}
                        </div>
                      </div>
                      <Standings
                        players={group.players}
                        matches={group.matches}
                        view={standingsView}
                        onViewChange={setStandingsView}
                        hideViewControls
                        hideProjection
                        tableOnly={leagueTableStandingsOnly}
                        leagueKnockoutQualifiers={leagueKnockoutStandingsMeta}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Standings
                  players={tablePlayers}
                  matches={getTournamentTableMatches(activeTournament)}
                  view={standingsView}
                  onViewChange={setStandingsView}
                  tableOnly={leagueTableStandingsOnly}
                  leagueKnockoutQualifiers={leagueKnockoutStandingsMeta}
                />
              ))}

            {workspaceTab === "BRACKET" &&
              supportsBracket(activeTournament.type) && (
                <TournamentBracket
                  tournament={activeTournament}
                  canManage={Boolean(currentTournamentAdmin)}
                />
              )}

            {workspaceTab === "MATCHES" && renderMatchesTab()}

            {workspaceTab === "PERFORMANCE" && (
              <MyPerformance
                players={allPlayers}
                matches={activeTournament.matches}
                currentAdmin={currentTournamentAdmin}
              />
            )}

            {workspaceTab === "STATS" && (
              <Dashboard
                players={allPlayers}
                matches={activeTournament.matches}
              />
            )}

            {workspaceTab === "SQUAD" && (
              <TournamentSquad
                tournament={activeTournament}
                playerPool={platform.playerPool}
                canManage={Boolean(currentTournamentAdmin)}
                onCreatePlayerProfile={handleCreatePoolPlayer}
                onAddParticipant={handleAddParticipant}
                onUpdateParticipantTeam={handleUpdateParticipantTeam}
                onRemoveParticipant={handleRemoveParticipant}
              />
            )}

            {workspaceTab === "ADMIN" && (
              <TournamentAdminPanel
                tournament={activeTournament}
                playerPool={platform.playerPool}
                currentAdmin={currentTournamentAdmin}
                onLogin={handleTournamentLogin}
                onLogout={handleTournamentLogout}
                onAddAdmin={handleAddTournamentAdmin}
                canManageRoster={Boolean(currentTournamentAdmin)}
                canEditTournamentStructure={Boolean(
                  currentTournamentAdmin &&
                    isTournamentBeforeFirstMatch(activeTournament),
                )}
                onApplyTournamentStructure={handleApplyTournamentStructure}
                onAddGuestToTournament={handleAddGuestToTournament}
                onAddParticipantToTournament={handleAddParticipant}
                onShuffleParticipants={handleShuffleParticipants}
                onReorderScheduleOrder={handleReorderScheduleOrder}
                onAssignLeagueKnockoutGroups={handleAssignLeagueKnockoutGroups}
                canDeleteTournament={Boolean(
                  globalAdmin || currentTournamentAdmin,
                )}
                onDeleteTournament={handleDeleteTournament}
              />
            )}
          </main>
        </>
      )}

      <footer className="relative border-t border-glass-border mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-text-muted" />
              <span className="text-xs font-medium text-text-muted">
                FIFA Tournament Platform
              </span>
              <span className="text-text-muted">·</span>
              <span className="text-xs text-text-muted">
                {platform.tournaments.length} tournaments
              </span>
            </div>
            <div className="text-[11px] text-text-muted font-medium">
              Powered by <span className="text-text-secondary">Superjoin</span>
            </div>
          </div>
        </div>
      </footer>

      {showGlobalLoginModal && (
        <GlobalAdminModal
          onClose={() => setShowGlobalLoginModal(false)}
          onSubmit={handleGlobalLogin}
        />
      )}

      {showCreateTournamentModal && (
        <CreateTournamentModal
          playerPool={platform.playerPool}
          onClose={() => setShowCreateTournamentModal(false)}
          onSubmit={handleCreateTournament}
        />
      )}

      {showRecordResultModal && (
        <RecordResultModal
          tournament={activeTournament}
          readyFixtures={readyFixtures}
          editingFixture={
            editingFixtureId
              ? (activeTournament.fixtures.find(
                  (fixture) => fixture.id === editingFixtureId,
                ) ?? null)
              : null
          }
          editingMatch={
            editingFixtureId
              ? (activeTournament.matches.find(
                  (match) => match.fixtureId === editingFixtureId,
                ) ?? null)
              : null
          }
          onClose={() => {
            setEditingFixtureId(null);
            setShowRecordResultModal(false);
          }}
          onSubmitOpenMatch={handleRecordOpenMatch}
          onSubmitFixtureResult={handleRecordFixtureResult}
          onSubmitEditFixtureResult={handleEditFixtureResult}
        />
      )}
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}> = ({ label, value, icon: Icon }) => (
  <div className="stat-card group">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-accent-green/10 border border-accent-green/15 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-accent-green" />
      </div>
    </div>
    <div className="text-xl sm:text-2xl font-extrabold text-text-primary font-mono tracking-tight truncate">
      {value}
    </div>
    <div className="text-[10px] sm:text-[11px] font-medium text-text-muted mt-1 uppercase tracking-wider">
      {label}
    </div>
  </div>
);

const PlatformHome: React.FC<{
  tournaments: Tournament[];
  activeTournamentId: string | null;
  globalAdmin: Admin | null;
  onOpenTournament: (id: string) => void;
  onOpenCreate: () => void;
  onGlobalLogin: () => void;
  onGlobalLogout: () => void;
}> = ({
  tournaments,
  activeTournamentId,
  globalAdmin,
  onOpenTournament,
  onOpenCreate,
  onGlobalLogin,
  onGlobalLogout,
}) => (
  <div className="space-y-6">
    <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-6">
      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-accent-green" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">
              Platform
            </div>
            <div className="text-xl font-bold text-text-primary">
              Tournament Hub
            </div>
          </div>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          Every tournament now lives as its own full workspace. The current
          league remains available as the open-ended `Superjoin FC26 League`,
          while new tournaments can run as league, knockout, or league +
          knockout competitions.
        </p>
      </div>

      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-accent-purple" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">
              Global Admin
            </div>
            <div className="text-base font-bold text-text-primary">
              {globalAdmin ? globalAdmin.name : "Locked"}
            </div>
          </div>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          Only the global admin can create new tournaments. Tournament admins
          remain scoped to each tournament.
        </p>
        <div className="flex gap-3">
          {globalAdmin ? (
            <>
              <button
                onClick={onOpenCreate}
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> Create
              </button>
              <button
                onClick={onGlobalLogout}
                className="btn-ghost flex-1 py-3 text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={onGlobalLogin}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm"
            >
              <KeyRound className="w-4 h-4" /> Login as Global Admin
            </button>
          )}
        </div>
      </div>
    </div>

    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {tournaments.map((tournament) => (
        <button
          key={tournament.id}
          onClick={() => onOpenTournament(tournament.id)}
          className={`glass-card text-left p-5 transition-all ${
            tournament.id === activeTournamentId
              ? "border-accent-green/25 shadow-[0_0_0_1px_rgba(0,230,118,0.15)]"
              : ""
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                {tournamentTypeLabel(tournament.type)}
              </div>
              <div className="flex items-center gap-3 mt-1 min-w-0">
                <img
                  src={tournament.trophyImage || getDefaultTrophyImage()}
                  alt={`${tournament.name} trophy`}
                  className="w-10 h-12 object-contain shrink-0 drop-shadow-[0_8px_18px_rgba(0,0,0,0.18)]"
                />
                <div className="text-lg font-bold text-text-primary truncate">
                  {tournament.name}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted shrink-0 mt-1" />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-5">
            <HomePill
              label="Players"
              value={String(tournament.participants.length)}
            />
            <HomePill
              label="Matches"
              value={String(tournament.matches.length)}
            />
            <HomePill label="Admins" value={String(tournament.admins.length)} />
          </div>
        </button>
      ))}
    </div>
  </div>
);

const HomePill: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="rounded-xl border border-glass-border bg-glass-light px-3 py-2">
    <div className="text-lg font-bold text-text-primary font-mono">{value}</div>
    <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
      {label}
    </div>
  </div>
);

const GlobalAdminModal: React.FC<{
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
}> = ({ onClose, onSubmit }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div
      className="modal-overlay"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="modal-content">
        <div className="relative px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-accent-purple" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Global Admin Login
              </h2>
              <p className="text-[11px] text-text-muted mt-0.5">
                Required to create new tournaments
              </p>
            </div>
          </div>
        </div>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            setError(null);
            try {
              await onSubmit(password);
            } catch (submitError) {
              setError(
                submitError instanceof Error
                  ? submitError.message
                  : "Login failed",
              );
            }
            setLoading(false);
          }}
          className="px-6 pb-6 space-y-4"
        >
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter Abhinav's password..."
            className="input-field w-full"
            autoFocus
          />
          {error && <div className="text-sm text-accent-red">{error}</div>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 py-3 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="btn-primary flex-1 py-3 text-sm disabled:opacity-30"
            >
              {loading ? "Checking..." : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RecordResultModal: React.FC<{
  tournament: Tournament;
  readyFixtures: TournamentFixture[];
  editingFixture: TournamentFixture | null;
  editingMatch: Match | null;
  onClose: () => void;
  onSubmitOpenMatch: (
    player1Id: string,
    player2Id: string,
    score1: number,
    score2: number,
  ) => void;
  onSubmitFixtureResult: (
    fixtureId: string,
    score1: number,
    score2: number,
  ) => void;
  onSubmitEditFixtureResult: (
    fixtureId: string,
    score1: number,
    score2: number,
  ) => void;
}> = ({
  tournament,
  readyFixtures,
  editingFixture,
  editingMatch,
  onClose,
  onSubmitOpenMatch,
  onSubmitFixtureResult,
  onSubmitEditFixtureResult,
}) => {
  const fixtureOptions = editingFixture ? [editingFixture] : readyFixtures;
  const [fixtureId, setFixtureId] = useState(
    editingFixture?.id ?? readyFixtures[0]?.id ?? "",
  );
  const [player1Id, setPlayer1Id] = useState(
    tournament.participants[0]?.id ?? "",
  );
  const [player2Id, setPlayer2Id] = useState(
    tournament.participants[1]?.id ?? "",
  );
  const [score1, setScore1] = useState(
    editingMatch ? String(editingMatch.score1) : "",
  );
  const [score2, setScore2] = useState(
    editingMatch ? String(editingMatch.score2) : "",
  );

  const selectedFixture = fixtureOptions.find(
    (fixture) => fixture.id === fixtureId,
  );

  const isOpenLeague = isOpenEnded(tournament.type);
  const isEditingFixture = Boolean(editingFixture);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (score1 === "" || score2 === "") return;
    const parsedScore1 = Number(score1);
    const parsedScore2 = Number(score2);

    if (isOpenLeague) {
      onSubmitOpenMatch(player1Id, player2Id, parsedScore1, parsedScore2);
      return;
    }

    if (selectedFixture) {
      if (isEditingFixture) {
        onSubmitEditFixtureResult(
          selectedFixture.id,
          parsedScore1,
          parsedScore2,
        );
      } else {
        onSubmitFixtureResult(selectedFixture.id, parsedScore1, parsedScore2);
      }
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="modal-content">
        <div className="relative px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
              <Swords className="w-4 h-4 text-accent-green" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                {isEditingFixture ? "Edit Result" : "Record Result"}
              </h2>
              <p className="text-[11px] text-text-muted mt-0.5">
                {isOpenLeague
                  ? "Choose any two registered players."
                  : isEditingFixture
                    ? "Update the recorded score for this fixture."
                    : "Select one of the ready fixtures."}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {isOpenLeague ? (
            <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block text-center">
                  Player 1
                </label>
                <select
                  value={player1Id}
                  onChange={(event) => setPlayer1Id(event.target.value)}
                  className="select-field w-full text-center text-xs"
                >
                  {tournament.participants.map((participant) => (
                    <option
                      key={participant.id}
                      value={participant.id}
                      disabled={participant.id === player2Id}
                    >
                      {participant.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  value={score1}
                  onChange={(event) => setScore1(event.target.value)}
                  placeholder="0"
                  className="input-field text-center text-3xl font-extrabold font-mono py-4"
                />
              </div>
              <div className="text-text-muted font-bold text-sm pb-6">VS</div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block text-center">
                  Player 2
                </label>
                <select
                  value={player2Id}
                  onChange={(event) => setPlayer2Id(event.target.value)}
                  className="select-field w-full text-center text-xs"
                >
                  {tournament.participants.map((participant) => (
                    <option
                      key={participant.id}
                      value={participant.id}
                      disabled={participant.id === player1Id}
                    >
                      {participant.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  value={score2}
                  onChange={(event) => setScore2(event.target.value)}
                  placeholder="0"
                  className="input-field text-center text-3xl font-extrabold font-mono py-4"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <select
                value={fixtureId}
                onChange={(event) => setFixtureId(event.target.value)}
                className="select-field w-full"
                disabled={isEditingFixture}
              >
                {fixtureOptions.map((fixture) => {
                  const participant1 = tournament.participants.find(
                    (participant) => participant.id === fixture.participant1Id,
                  );
                  const participant2 = tournament.participants.find(
                    (participant) => participant.id === fixture.participant2Id,
                  );
                  return (
                    <option key={fixture.id} value={fixture.id}>
                      {fixture.roundName} · {participant1?.name ?? "TBD"} vs{" "}
                      {participant2?.name ?? "TBD"}
                    </option>
                  );
                })}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  value={score1}
                  onChange={(event) => setScore1(event.target.value)}
                  placeholder="Player 1 score"
                  className="input-field text-center text-2xl font-extrabold font-mono py-4"
                />
                <input
                  type="number"
                  min="0"
                  value={score2}
                  onChange={(event) => setScore2(event.target.value)}
                  placeholder="Player 2 score"
                  className="input-field text-center text-2xl font-extrabold font-mono py-4"
                />
              </div>
              {selectedFixture && !selectedFixture.allowDraw && (
                <div className="text-[11px] text-accent-red">
                  Knockout fixtures cannot end in a draw. Enter the final winner
                  after extra time or penalties.
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 py-3 text-sm"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 py-3 text-sm">
              {isEditingFixture ? "Save Changes" : "Save Result"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;
