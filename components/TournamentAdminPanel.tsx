import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Admin,
  PlayerProfile,
  Tournament,
  TournamentType,
} from "../types";
import { buildTournamentPlanSummary } from "../utils/createTournamentPlan";
import {
  canonicalLeagueKnockoutGroupNames,
  DEFAULT_TOURNAMENT_SETTINGS,
  flattenParticipantsByCanonicalLeagueGroups,
  getEffectiveGroupCount,
  getTournamentTargetPlayerCount,
  isOpenEnded,
  tournamentHasExplicitLeagueGroups,
  tournamentTypeLabel,
} from "../utils/tournaments";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  GitBranch,
  History,
  KeyRound,
  LayoutGrid,
  LogIn,
  LogOut,
  Lock,
  Plus,
  ShieldCheck,
  Shuffle,
  Trash2,
  User,
  UserPlus,
  Users,
} from "lucide-react";

const STRUCTURE_TYPE_OPTIONS: Array<{
  value: TournamentType;
  label: string;
  detail: string;
}> = [
  { value: "OPEN_LEAGUE", label: "Open League", detail: "No fixed schedule" },
  { value: "LEAGUE", label: "League", detail: "Round robin" },
  { value: "KNOCKOUT", label: "Knockout", detail: "Bracket only" },
  {
    value: "LEAGUE_KNOCKOUT",
    label: "League + KO",
    detail: "Table then bracket",
  },
];

interface TournamentAdminPanelProps {
  tournament: Tournament;
  playerPool: PlayerProfile[];
  currentAdmin: Admin | null;
  onLogin: (
    name: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onLogout: () => void;
  onAddAdmin: (name: string, password: string) => void;
  canManageRoster: boolean;
  canEditTournamentStructure: boolean;
  onApplyTournamentStructure: (draft: {
    type: TournamentType;
    targetPlayerCount: number;
    matchesPerOpponent: number;
    groupCount: number;
    qualifierCount: number;
  }) => boolean;
  onAddGuestToTournament: (guestName: string, teamName: string) => boolean;
  onAddParticipantToTournament: (
    profileId: string,
    teamName: string,
  ) => boolean;
  onShuffleParticipants: () => boolean;
  onReorderScheduleOrder: (
    orderedParticipantIds: string[],
    groupName?: string,
  ) => boolean;
  onAssignLeagueKnockoutGroups: (
    groupByParticipantId: Record<string, string>,
  ) => boolean;
  canDeleteTournament: boolean;
  onDeleteTournament: () => void | Promise<void>;
}

export const TournamentAdminPanel: React.FC<TournamentAdminPanelProps> = ({
  tournament,
  playerPool,
  currentAdmin,
  onLogin,
  onLogout,
  onAddAdmin,
  canManageRoster,
  canEditTournamentStructure,
  onApplyTournamentStructure,
  onAddGuestToTournament,
  onAddParticipantToTournament,
  onShuffleParticipants,
  onReorderScheduleOrder,
  onAssignLeagueKnockoutGroups,
  canDeleteTournament,
  onDeleteTournament,
}) => {
  const [adminName, setAdminName] = useState(tournament.admins[0]?.name ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [applySetupFeedback, setApplySetupFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const applySetupFeedbackTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const showApplySetupFeedback = (
    kind: "success" | "error",
    message: string,
  ) => {
    if (applySetupFeedbackTimerRef.current) {
      clearTimeout(applySetupFeedbackTimerRef.current);
    }
    setApplySetupFeedback({ kind, message });
    applySetupFeedbackTimerRef.current = setTimeout(() => {
      setApplySetupFeedback(null);
      applySetupFeedbackTimerRef.current = null;
    }, kind === "success" ? 5200 : 9000);
  };

  useEffect(() => {
    return () => {
      if (applySetupFeedbackTimerRef.current) {
        clearTimeout(applySetupFeedbackTimerRef.current);
      }
    };
  }, []);

  const mergedSettings = {
    ...DEFAULT_TOURNAMENT_SETTINGS,
    ...tournament.settings,
  };

  const [structType, setStructType] = useState<TournamentType>(tournament.type);
  const [structMpo, setStructMpo] = useState(mergedSettings.matchesPerOpponent);
  const [structGroupCount, setStructGroupCount] = useState(
    mergedSettings.groupCount,
  );
  const [structQualifier, setStructQualifier] = useState(
    mergedSettings.qualifierCount,
  );
  const [structTargetCount, setStructTargetCount] = useState(() =>
    getTournamentTargetPlayerCount(tournament),
  );

  const [guestName, setGuestName] = useState("");
  const [guestTeam, setGuestTeam] = useState("");
  const [poolProfileId, setPoolProfileId] = useState("");
  const [poolTeamName, setPoolTeamName] = useState("");

  useEffect(() => {
    const s = {
      ...DEFAULT_TOURNAMENT_SETTINGS,
      ...tournament.settings,
    };
    setStructType(tournament.type);
    setStructMpo(s.matchesPerOpponent);
    setStructGroupCount(s.groupCount);
    setStructQualifier(s.qualifierCount);
    setStructTargetCount(getTournamentTargetPlayerCount(tournament));
  }, [
    tournament.id,
    tournament.type,
    tournament.targetPlayerCount,
    tournament.participants.length,
    tournament.settings.matchesPerOpponent,
    tournament.settings.groupCount,
    tournament.settings.qualifierCount,
  ]);

  const participantCount = tournament.participants.length;
  const planningPlayerCount = Math.max(participantCount, structTargetCount);
  const rosterUnlocked =
    isOpenEnded(tournament.type) || tournament.matches.length === 0;

  const scheduleReorderMultiGroup =
    tournament.type === "LEAGUE_KNOCKOUT" &&
    tournamentHasExplicitLeagueGroups(tournament);

  const allowedScheduleGroups = useMemo(
    () =>
      canonicalLeagueKnockoutGroupNames(
        participantCount,
        mergedSettings.groupCount,
      ),
    [participantCount, mergedSettings.groupCount],
  );

  const scheduleMultiGroupRows = useMemo(() => {
    if (!scheduleReorderMultiGroup) return [];
    return flattenParticipantsByCanonicalLeagueGroups(
      tournament.participants,
      tournament.participants,
      allowedScheduleGroups,
    );
  }, [
    scheduleReorderMultiGroup,
    tournament.participants,
    allowedScheduleGroups,
  ]);

  const availablePoolProfiles = useMemo(() => {
    const taken = new Set(
      tournament.participants.map((p) => p.profileId),
    );
    return playerPool.filter((p) => !taken.has(p.id));
  }, [playerPool, tournament.participants]);

  const planSummary = useMemo(
    () =>
      buildTournamentPlanSummary({
        type: structType,
        playerCount: planningPlayerCount,
        matchesPerOpponent: structMpo,
        qualifierCount: structQualifier,
        groupCount: structGroupCount,
      }),
    [
      structType,
      planningPlayerCount,
      structMpo,
      structQualifier,
      structGroupCount,
    ],
  );

  const trimmedTournamentName = tournament.name.trim();
  const deleteNameMatches =
    deleteConfirmText.trim() === trimmedTournamentName && trimmedTournamentName.length > 0;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await onLogin(adminName, password);
    setLoading(false);
    if (result.success) {
      setPassword("");
    } else {
      setError(result.error || "Login failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteNameMatches || deleteBusy) return;
    setDeleteBusy(true);
    try {
      await Promise.resolve(onDeleteTournament());
      setDeleteConfirmText("");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-text-primary">Settings</h2>
        <span className="text-[11px] text-text-muted">
          Admin access and tournament options
        </span>
      </div>

      {currentAdmin && canEditTournamentStructure && (
        <div className="glass-card overflow-hidden">
          <div className="h-px bg-gradient-to-r from-transparent via-accent-green/35 to-transparent"></div>
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
                <LayoutGrid className="w-4 h-4 text-accent-green" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Competition setup
                </h3>
                <p className="text-[11px] text-text-muted">
                  Change format, groups, and schedule rules until the first
                  result is recorded. Applying updates regenerates fixtures from
                  the current squad.
                </p>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-2">
                Target player count
              </label>
              <input
                type="number"
                min={2}
                max={999}
                value={structTargetCount}
                onChange={(e) =>
                  setStructTargetCount(
                    Math.max(2, Math.min(999, Number(e.target.value) || 2)),
                  )
                }
                className="input-field w-full max-w-[200px]"
              />
              <p className="text-[10px] text-text-muted mt-1.5 leading-relaxed">
                Used for schedule previews and group limits. Actual entries
                below are the {participantCount} player
                {participantCount !== 1 ? "s" : ""} currently in this
                tournament.
              </p>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-2">
                Tournament type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                {STRUCTURE_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStructType(option.value)}
                    className={`rounded-xl border px-2.5 py-2.5 text-left transition-all ${
                      structType === option.value
                        ? "border-accent-green/35 bg-accent-green/10 shadow-[0_0_0_1px_rgba(0,230,118,0.12)]"
                        : "border-glass-border bg-glass-light hover:border-glass-border-hover"
                    }`}
                  >
                    <div className="text-xs font-semibold text-text-primary leading-tight">
                      {option.label}
                    </div>
                    <div className="text-[11px] text-text-muted mt-1 leading-snug">
                      {option.detail}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {structType !== "OPEN_LEAGUE" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(structType === "LEAGUE" || structType === "LEAGUE_KNOCKOUT") && (
                  <div>
                    <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-2">
                      Matches per opponent
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={structMpo}
                      onChange={(e) =>
                        setStructMpo(Math.max(1, Number(e.target.value) || 1))
                      }
                      className="input-field w-full"
                    />
                  </div>
                )}
                {structType === "LEAGUE_KNOCKOUT" && (
                  <>
                    <div>
                      <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-2">
                        League groups
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={Math.max(1, Math.floor(planningPlayerCount / 2))}
                        value={structGroupCount}
                        onChange={(e) =>
                          setStructGroupCount(
                            Math.max(1, Number(e.target.value) || 1),
                          )
                        }
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-2">
                        Qualifiers to knockout
                      </label>
                      <input
                        type="number"
                        min={Math.max(
                          2,
                          getEffectiveGroupCount(
                            planningPlayerCount,
                            structGroupCount,
                          ),
                        )}
                        value={structQualifier}
                        onChange={(e) =>
                          setStructQualifier(
                            Math.max(2, Number(e.target.value) || 2),
                          )
                        }
                        className="input-field w-full"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="rounded-xl border border-glass-border bg-glass-light p-3 space-y-2">
              <div className="flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-accent-2 shrink-0" />
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  Preview (planning {planningPlayerCount} · registered{" "}
                  {participantCount})
                </span>
              </div>
              <p className="text-sm font-semibold text-text-primary leading-snug">
                {planSummary.headline}
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                {planSummary.breakdown}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const ok = onApplyTournamentStructure({
                  type: structType,
                  targetPlayerCount: structTargetCount,
                  matchesPerOpponent: Number(structMpo),
                  groupCount: Number(structGroupCount),
                  qualifierCount: Number(structQualifier),
                });
                if (ok) {
                  showApplySetupFeedback(
                    "success",
                    "Setup saved. Fixtures were regenerated from your current squad.",
                  );
                } else {
                  showApplySetupFeedback(
                    "error",
                    "Could not apply setup. If a match was just recorded, the format is locked. Otherwise try again.",
                  );
                }
              }}
              className="btn-primary w-full py-3 text-sm"
            >
              Apply setup & regenerate fixtures
            </button>

            <div
              role="status"
              aria-live="polite"
              className="min-h-[3rem] flex items-start"
            >
              {applySetupFeedback && (
                <div
                  className={`w-full flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium leading-snug ${
                    applySetupFeedback.kind === "success"
                      ? "border-accent-green/25 bg-accent-green/8 text-accent-green"
                      : "border-accent-red/25 bg-accent-red/8 text-accent-red"
                  }`}
                >
                  {applySetupFeedback.kind === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{applySetupFeedback.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentAdmin && canManageRoster && (
        <div className="glass-card overflow-hidden">
          <div className="h-px bg-gradient-to-r from-transparent via-accent-purple/30 to-transparent"></div>
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-accent-purple" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Players & guests
                </h3>
                <p className="text-[11px] text-text-muted">
                  Add people to the tournament or randomize seeding. Structured
                  leagues lock roster changes after the first result.
                </p>
              </div>
            </div>

            {!rosterUnlocked && (
              <div className="text-xs text-text-secondary rounded-xl border border-glass-border bg-glass-light px-3 py-2">
                Roster edits are locked for this format because at least one
                match has been recorded.
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-glass-border bg-glass-light p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <UserPlus className="w-3.5 h-3.5 text-accent-green" />
                  New guest
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Creates a pool profile if needed and registers them in this
                  tournament.
                </p>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Player name"
                  disabled={!rosterUnlocked}
                  className="input-field w-full"
                />
                <input
                  type="text"
                  value={guestTeam}
                  onChange={(e) => setGuestTeam(e.target.value)}
                  placeholder="Team / club name"
                  disabled={!rosterUnlocked}
                  className="input-field w-full"
                />
                <button
                  type="button"
                  disabled={
                    !rosterUnlocked ||
                    !guestName.trim() ||
                    !guestTeam.trim()
                  }
                  onClick={() => {
                    const ok = onAddGuestToTournament(
                      guestName,
                      guestTeam,
                    );
                    if (ok) {
                      setGuestName("");
                      setGuestTeam("");
                    } else {
                      alert(
                        "Could not add guest. They may already be in this tournament, or roster is locked.",
                      );
                    }
                  }}
                  className="btn-primary w-full py-2.5 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 inline-block mr-1.5 align-text-bottom" />
                  Add guest to tournament
                </button>
              </div>

              <div className="rounded-xl border border-glass-border bg-glass-light p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5 text-accent-blue" />
                  From player pool
                </div>
                <select
                  value={poolProfileId}
                  onChange={(e) => setPoolProfileId(e.target.value)}
                  disabled={!rosterUnlocked || availablePoolProfiles.length === 0}
                  className="select-field w-full"
                >
                  <option value="">Select player</option>
                  {availablePoolProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={poolTeamName}
                  onChange={(e) => setPoolTeamName(e.target.value)}
                  placeholder="Team / club name"
                  disabled={!rosterUnlocked}
                  className="input-field w-full"
                />
                <button
                  type="button"
                  disabled={
                    !rosterUnlocked ||
                    !poolProfileId ||
                    !poolTeamName.trim()
                  }
                  onClick={() => {
                    const ok = onAddParticipantToTournament(
                      poolProfileId,
                      poolTeamName.trim(),
                    );
                    if (ok) {
                      setPoolProfileId("");
                      setPoolTeamName("");
                    } else {
                      alert(
                        "Could not add from pool. They may already be in this tournament, or the player was not found.",
                      );
                    }
                  }}
                  className="btn-primary w-full py-2.5 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 inline-block mr-1.5 align-text-bottom" />
                  Add to tournament
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-glass-border bg-glass-light p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                    <Shuffle className="w-3.5 h-3.5 text-accent-2" />
                    Shuffle order
                  </div>
                  <p className="text-[11px] text-text-muted mt-1 leading-relaxed max-w-xl">
                    Randomizes player order and re-seeds everyone. Regenerates
                    fixtures for league / knockout formats (only before any match
                    is recorded).
                  </p>
                </div>
                <button
                  type="button"
                  disabled={
                    !canManageRoster ||
                    tournament.matches.length > 0 ||
                    participantCount < 2
                  }
                  onClick={() => {
                    const ok = onShuffleParticipants();
                    if (!ok) {
                      alert(
                        "Shuffle needs at least 2 players and no recorded matches.",
                      );
                    }
                  }}
                  className="btn-ghost shrink-0 px-4 py-2.5 text-sm border border-glass-border hover:border-accent-2/30 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Shuffle className="w-4 h-4" />
                  Shuffle players
                </button>
              </div>
            </div>

            {!isOpenEnded(tournament.type) &&
              rosterUnlocked &&
              participantCount >= 2 && (
                <div className="rounded-xl border border-glass-border bg-glass-light p-4 space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                      <LayoutGrid className="w-3.5 h-3.5 text-accent-blue" />
                      Schedule order
                    </div>
                    <p className="text-[11px] text-text-muted mt-1 leading-relaxed max-w-xl">
                      {scheduleReorderMultiGroup
                        ? "Assign each player to a league group and move them up or down within that group. Fixtures update until the first result is recorded."
                        : "Move players in the list to change round-robin or knockout slot order before the first result is recorded."}
                    </p>
                  </div>

                  {scheduleReorderMultiGroup
                    ? (
                        <ul className="space-y-1.5">
                          {scheduleMultiGroupRows.map((p) => {
                            const rowsInGroup = scheduleMultiGroupRows.filter(
                              (r) => r.groupName === p.groupName,
                            );
                            const index = rowsInGroup.findIndex(
                              (r) => r.id === p.id,
                            );
                            const gn = p.groupName ?? "";
                            return (
                              <li
                                key={p.id}
                                className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-lg border border-glass-border bg-glass-dark/20 px-2.5 py-2"
                              >
                                <div className="min-w-0 flex-1 basis-[min(100%,12rem)]">
                                  <div className="text-sm font-semibold text-text-primary truncate">
                                    {p.name}
                                  </div>
                                  <div className="text-[10px] text-text-muted truncate">
                                    {p.teamName}
                                  </div>
                                </div>
                                <select
                                  aria-label={`Group for ${p.name}`}
                                  value={gn}
                                  onChange={(e) => {
                                    const next = Object.fromEntries(
                                      tournament.participants.map((x) => [
                                        x.id,
                                        x.id === p.id
                                          ? e.target.value
                                          : (x.groupName ?? "").trim(),
                                      ]),
                                    ) as Record<string, string>;
                                    if (!onAssignLeagueKnockoutGroups(next)) {
                                      alert("Could not update group assignment.");
                                    }
                                  }}
                                  className="select-field shrink-0 w-full sm:w-[8.25rem] text-xs py-1.5"
                                >
                                  {allowedScheduleGroups.map((label) => (
                                    <option key={label} value={label}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                                <div className="flex flex-col gap-0.5 shrink-0 ml-auto sm:ml-0">
                                  <button
                                    type="button"
                                    title="Move up in group"
                                    disabled={index <= 0}
                                    onClick={() => {
                                      const ids = rowsInGroup.map((r) => r.id);
                                      const i = ids.indexOf(p.id);
                                      if (i <= 0) return;
                                      const next = [...ids];
                                      [next[i - 1], next[i]] = [
                                        next[i]!,
                                        next[i - 1]!,
                                      ];
                                      if (!onReorderScheduleOrder(next, gn)) {
                                        alert("Could not update order.");
                                      }
                                    }}
                                    className="w-8 h-7 rounded-md border border-glass-border bg-glass-light flex items-center justify-center text-text-muted hover:text-text-primary hover:border-glass-border-hover disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Move down in group"
                                    disabled={
                                      index < 0 ||
                                      index >= rowsInGroup.length - 1
                                    }
                                    onClick={() => {
                                      const ids = rowsInGroup.map((r) => r.id);
                                      const i = ids.indexOf(p.id);
                                      if (i < 0 || i >= ids.length - 1) return;
                                      const next = [...ids];
                                      [next[i], next[i + 1]] = [
                                        next[i + 1]!,
                                        next[i]!,
                                      ];
                                      if (!onReorderScheduleOrder(next, gn)) {
                                        alert("Could not update order.");
                                      }
                                    }}
                                    className="w-8 h-7 rounded-md border border-glass-border bg-glass-light flex items-center justify-center text-text-muted hover:text-text-primary hover:border-glass-border-hover disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )
                    : (
                        <ul className="space-y-1.5">
                          {tournament.participants.map((p, index) => (
                            <li
                              key={p.id}
                              className="flex items-center gap-2 rounded-lg border border-glass-border bg-glass-dark/20 px-2.5 py-2"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-text-primary truncate">
                                  {p.name}
                                </div>
                                <div className="text-[10px] text-text-muted truncate">
                                  {p.teamName}
                                </div>
                              </div>
                              <div className="flex flex-col gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  title="Move up"
                                  disabled={index === 0}
                                  onClick={() => {
                                    const ids = tournament.participants.map(
                                      (r) => r.id,
                                    );
                                    const i = ids.indexOf(p.id);
                                    if (i <= 0) return;
                                    const next = [...ids];
                                    [next[i - 1], next[i]] = [
                                      next[i]!,
                                      next[i - 1]!,
                                    ];
                                    if (!onReorderScheduleOrder(next)) {
                                      alert("Could not update order.");
                                    }
                                  }}
                                  className="w-8 h-7 rounded-md border border-glass-border bg-glass-light flex items-center justify-center text-text-muted hover:text-text-primary hover:border-glass-border-hover disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  title="Move down"
                                  disabled={
                                    index ===
                                    tournament.participants.length - 1
                                  }
                                  onClick={() => {
                                    const ids = tournament.participants.map(
                                      (r) => r.id,
                                    );
                                    const i = ids.indexOf(p.id);
                                    if (i < 0 || i >= ids.length - 1) return;
                                    const next = [...ids];
                                    [next[i], next[i + 1]] = [
                                      next[i + 1]!,
                                      next[i]!,
                                    ];
                                    if (!onReorderScheduleOrder(next)) {
                                      alert("Could not update order.");
                                    }
                                  }}
                                  className="w-8 h-7 rounded-md border border-glass-border bg-glass-light flex items-center justify-center text-text-muted hover:text-text-primary hover:border-glass-border-hover disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                </div>
              )}
          </div>
        </div>
      )}

      {currentAdmin &&
        !canEditTournamentStructure &&
        !isOpenEnded(tournament.type) && (
          <div className="glass-card p-4 flex gap-3 items-start border-glass-border">
            <div className="w-8 h-8 rounded-lg bg-glass-light border border-glass-border flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-text-muted" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Competition format locked
              </h3>
              <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                This tournament is{" "}
                <span className="text-text-secondary font-medium">
                  {tournamentTypeLabel(tournament.type)}
                </span>
                . Type, groups, and fixture layout cannot be changed after the
                first match has been recorded.
              </p>
            </div>
          </div>
        )}

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="glass-card overflow-hidden">
          <div className="h-px bg-gradient-to-r from-transparent via-accent-purple/40 to-transparent"></div>

          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-accent-purple" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Tournament Admin
                </h3>
                <p className="text-[11px] text-text-muted">
                  Admin access is unique to {tournament.name}
                </p>
              </div>
            </div>

            {currentAdmin ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-glass-light border border-glass-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-green/20 to-accent-purple/20 border border-glass-border flex items-center justify-center">
                      <User className="w-6 h-6 text-accent-green" />
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                        Logged in as
                      </div>
                      <div className="text-lg font-bold text-text-primary">
                        {currentAdmin.name}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-accent-green/5 border border-accent-green/10 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-accent-green shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-accent-green">
                      Tournament admin access active
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      You can manage this tournament’s squad, results, and admin
                      roster.
                    </div>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="btn-ghost flex items-center gap-2 text-sm text-accent-red border-accent-red/20 hover:bg-accent-red/10 w-full justify-center"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-2">
                    Admin
                  </label>
                  <select
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="select-field w-full"
                    disabled={loading}
                  >
                    <option value="">Select admin</option>
                    {tournament.admins.map((admin) => (
                      <option key={admin.id} value={admin.name}>
                        {admin.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter tournament admin password..."
                    className="input-field"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-accent-red/8 border border-accent-red/15 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-accent-red shrink-0" />
                    <span className="text-xs font-medium text-accent-red">
                      {error}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !adminName || !password.trim()}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <LogIn className="w-4 h-4" />
                  {loading ? "Authenticating..." : "Login"}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="h-px bg-gradient-to-r from-transparent via-accent-blue/30 to-transparent"></div>
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
                <History className="w-4 h-4 text-accent-blue" />
              </div>
              <h3 className="text-sm font-bold text-text-primary">
                Admin Roster
              </h3>
            </div>

            <div className="space-y-2 mb-5">
              {tournament.admins.map((admin) => (
                <div
                  key={admin.id}
                  className="p-3 rounded-xl border border-glass-border bg-glass-light"
                >
                  <div className="font-semibold text-text-primary text-sm">
                    {admin.name}
                  </div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
                    Tournament Admin
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-glass-light border border-glass-border space-y-3">
              <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                Add Admin
              </div>
              <input
                type="text"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                placeholder="Admin name"
                className="input-field w-full"
                disabled={!canManageRoster}
              />
              <input
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="Admin password"
                className="input-field w-full"
                disabled={!canManageRoster}
              />
              <button
                onClick={() => {
                  if (!newAdminName.trim() || !newAdminPassword.trim()) return;
                  onAddAdmin(newAdminName.trim(), newAdminPassword.trim());
                  setNewAdminName("");
                  setNewAdminPassword("");
                }}
                type="button"
                disabled={
                  !canManageRoster ||
                  !newAdminName.trim() ||
                  !newAdminPassword.trim()
                }
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> Add Tournament Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-glass-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
            <History className="w-4 h-4 text-accent-green" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              Login History
            </h3>
            <p className="text-[10px] text-text-muted">
              Recent admin activity for this tournament
            </p>
          </div>
        </div>

        <div className="p-3 sm:p-4 space-y-2">
          {tournament.adminAudit.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-sm">
              No login attempts recorded yet.
            </div>
          ) : (
            tournament.adminAudit.map((entry) => (
              <div
                key={entry.id}
                className={`p-3 rounded-xl border ${
                  entry.success
                    ? "bg-accent-green/3 border-accent-green/10"
                    : "bg-accent-red/3 border-accent-red/10"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-text-primary text-sm">
                      {entry.adminNameSnapshot}
                    </div>
                    <div className="text-[10px] text-text-muted mt-1">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                      entry.success
                        ? "bg-accent-green/10 text-accent-green border border-accent-green/15"
                        : "bg-accent-red/10 text-accent-red border border-accent-red/15"
                    }`}
                  >
                    {entry.success ? "Success" : "Failed"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {canDeleteTournament && (
        <div className="glass-card overflow-hidden border border-accent-red/15">
          <div className="h-px bg-gradient-to-r from-transparent via-accent-red/35 to-transparent"></div>
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-accent-red/10 border border-accent-red/25 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-accent-red" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Danger zone
                </h3>
                <p className="text-[11px] text-text-muted mt-1">
                  Permanently delete this tournament, including all matches,
                  fixtures, and admin history. This cannot be undone.
                </p>
              </div>
            </div>

            <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-2">
              Type the tournament name to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={trimmedTournamentName || "Tournament name"}
              autoComplete="off"
              className="input-field w-full mb-4"
              disabled={deleteBusy}
            />

            <button
              type="button"
              onClick={handleDelete}
              disabled={!deleteNameMatches || deleteBusy}
              className="btn-ghost w-full py-3 flex items-center justify-center gap-2 text-sm text-accent-red border-accent-red/25 hover:bg-accent-red/10 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              {deleteBusy ? "Deleting…" : "Delete tournament"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
