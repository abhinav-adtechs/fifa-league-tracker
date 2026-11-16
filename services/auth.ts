import { Capacitor } from "@capacitor/core";
import {
  Admin,
  PlatformState,
  Tournament,
  TournamentAdmin,
  TournamentAdminAudit,
} from "../types";
import { supabase } from "./supabaseClient";
import { sessionStorage } from "./sessionStorage";
import { getDefaultTrophyImage } from "../utils/tournaments";

export interface LoginAuditEntry {
  id: number;
  admin_id: string | null;
  admin_name_snapshot: string;
  login_at: string;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
}

const GLOBAL_AUTH_STORAGE_KEY = "global_admin_auth";
const GLOBAL_ADMIN_NAME = "abhinav";
const LEGACY_TOURNAMENT_ID = "superjoin-fc26-league";
const LEGACY_TOURNAMENT_NAME = "superjoin fc26 league";

// Admins of the original league. Their passwords live only in Supabase
// (`admin_passwords`, bcrypt), so their tournament entries carry no local hash
// and are verified through the `verify_admin_password` RPC.
const LEGACY_ADMIN_NAMES = ["manan", "abhinav", "sagar", "karan", "mukul"];
const SEEDED_ADMIN_ID_PREFIX = "seed-admin-";

function getUserAgent(): string {
  if (Capacitor.isNativePlatform()) {
    return "FIFA League Tracker iOS";
  }
  return typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
}

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string): Promise<string> {
  return sha256(password.trim());
}

async function fetchIpAddress(): Promise<string | null> {
  return fetch("https://api.ipify.org?format=json")
    .then((res) => res.json())
    .then((data) => data.ip as string)
    .catch(() => null);
}

export function buildLegacyTournamentAdmins(): TournamentAdmin[] {
  const now = Date.now();
  return LEGACY_ADMIN_NAMES.map((name, index) => ({
    id: `${SEEDED_ADMIN_ID_PREFIX}${index}-${name}`,
    name,
    passwordHash: "",
    createdAt: now + index,
  }));
}

export function buildDefaultTournamentAdmins(): TournamentAdmin[] {
  return buildLegacyTournamentAdmins().filter(
    (admin) => admin.name === GLOBAL_ADMIN_NAME,
  );
}

function normalizeAdminName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

function isLegacyTournament(tournament: Tournament): boolean {
  return (
    tournament.id === LEGACY_TOURNAMENT_ID ||
    normalizeAdminName(tournament.name) === LEGACY_TOURNAMENT_NAME
  );
}

// Older builds stored SHA-256 hashes of hard-coded passwords for these admins
// in the shared platform state. Clearing them means only Supabase can verify them.
function isSupabaseOnlyAdmin(
  tournament: Tournament,
  admin: TournamentAdmin,
): boolean {
  return (
    admin.id.startsWith(SEEDED_ADMIN_ID_PREFIX) ||
    (isLegacyTournament(tournament) &&
      LEGACY_ADMIN_NAMES.includes(normalizeAdminName(admin.name)))
  );
}

function reconcileTournamentAdmins(tournament: Tournament): Tournament {
  const existingNames = new Set(
    tournament.admins.map((admin) => normalizeAdminName(admin.name)),
  );
  const missingLegacyAdmins = isLegacyTournament(tournament)
    ? buildLegacyTournamentAdmins().filter(
        (admin) => !existingNames.has(admin.name),
      )
    : [];
  const admins = tournament.admins.map((admin) =>
    admin.passwordHash && isSupabaseOnlyAdmin(tournament, admin)
      ? { ...admin, passwordHash: "" }
      : admin,
  );

  const changed =
    missingLegacyAdmins.length > 0 ||
    admins.some((admin, index) => admin !== tournament.admins[index]);
  if (!changed) {
    return tournament;
  }

  return {
    ...tournament,
    trophyImage: tournament.trophyImage || getDefaultTrophyImage(),
    admins: [...admins, ...missingLegacyAdmins],
    updatedAt: Date.now(),
  };
}

export function reconcilePlatformAdmins(
  platform: PlatformState,
): PlatformState {
  const tournaments = platform.tournaments.map(reconcileTournamentAdmins);

  const changed = tournaments.some(
    (tournament, index) => tournament !== platform.tournaments[index],
  );
  if (!changed) {
    return platform;
  }

  return {
    ...platform,
    tournaments,
  };
}

async function saveGlobalSession(admin: Admin): Promise<void> {
  await sessionStorage.setItem(
    GLOBAL_AUTH_STORAGE_KEY,
    JSON.stringify({
      admin,
      timestamp: Date.now(),
    }),
  );
}

async function readGlobalSession(): Promise<Admin | null> {
  const stored = await sessionStorage.getItem(GLOBAL_AUTH_STORAGE_KEY);
  if (!stored) return null;

  try {
    const data = JSON.parse(stored);
    if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
      await sessionStorage.removeItem(GLOBAL_AUTH_STORAGE_KEY);
      return null;
    }
    return data.admin as Admin;
  } catch {
    return null;
  }
}

async function loginWithSupabase(
  password: string,
): Promise<{ success: boolean; admin?: Admin; error?: string }> {
  if (!supabase) {
    return {
      success: false,
      error: "Admin login needs Supabase (SUPABASE_URL and SUPABASE_ANON_KEY)",
    };
  }

  try {
    const { data: adminData, error } = await supabase.rpc(
      "verify_admin_password",
      {
        plain_password: password.trim(),
      },
    );

    if (error) {
      console.error("verify_admin_password RPC:", error);
      return { success: false, error: error.message || "Login failed" };
    }

    const matched = Array.isArray(adminData) ? adminData[0] : null;
    if (
      !matched ||
      String(matched.name).toLowerCase().trim() !== GLOBAL_ADMIN_NAME
    ) {
      return { success: false, error: "Invalid global admin password" };
    }

    const admin: Admin = { id: matched.id, name: matched.name };
    await saveGlobalSession(admin);
    return { success: true, admin };
  } catch (error) {
    console.error("Global login error:", error);
    return { success: false, error: "Login failed" };
  }
}

async function verifyAdminWithSupabase(
  adminName: string,
  password: string,
): Promise<Admin | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data: adminData, error } = await supabase.rpc(
      "verify_admin_password",
      {
        plain_password: password.trim(),
      },
    );

    if (error) {
      console.error("verify_admin_password RPC (legacy tournament):", error);
      return null;
    }

    const matched = Array.isArray(adminData) ? adminData[0] : null;
    if (!matched) {
      return null;
    }

    if (
      normalizeAdminName(String(matched.name)) !== normalizeAdminName(adminName)
    ) {
      return null;
    }

    return {
      id: String(matched.id),
      name: String(matched.name),
    };
  } catch (error) {
    console.error("Legacy tournament Supabase verification error:", error);
    return null;
  }
}

export const globalAuth = {
  isAuthenticated: async (): Promise<boolean> => {
    return Boolean(await readGlobalSession());
  },

  getCurrentAdmin: async (): Promise<Admin | null> => {
    return readGlobalSession();
  },

  login: loginWithSupabase,

  logout: async (): Promise<void> => {
    await sessionStorage.removeItem(GLOBAL_AUTH_STORAGE_KEY);
  },
};

export const auth = {
  isAuthenticated: globalAuth.isAuthenticated,
  getCurrentAdmin: globalAuth.getCurrentAdmin,
  login: globalAuth.login,
  logout: globalAuth.logout,
  getLoginAudit: async (_limit: number = 100): Promise<LoginAuditEntry[]> => [],
};

export async function verifyTournamentAdmin(
  tournament: Tournament,
  adminName: string,
  password: string,
): Promise<TournamentAdmin | null> {
  const passwordHash = await hashPassword(password);
  const matched = tournament.admins.find(
    (admin) =>
      admin.name.toLowerCase().trim() === adminName.toLowerCase().trim() &&
      admin.passwordHash === passwordHash,
  );
  if (matched) return matched;

  if (
    normalizeAdminName(adminName) !== GLOBAL_ADMIN_NAME &&
    !isLegacyTournament(tournament)
  ) {
    return null;
  }

  const supabaseMatched = await verifyAdminWithSupabase(adminName, password);
  if (!supabaseMatched) return null;

  return (
    tournament.admins.find(
      (admin) =>
        normalizeAdminName(admin.name) ===
        normalizeAdminName(supabaseMatched.name),
    ) ?? {
      id: supabaseMatched.id,
      name: supabaseMatched.name,
      passwordHash: "",
      createdAt: Date.now(),
    }
  );
}

export function appendTournamentAdminAudit(
  tournament: Tournament,
  entry: Omit<TournamentAdminAudit, "id" | "timestamp">,
): Tournament {
  return {
    ...tournament,
    adminAudit: [
      {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        ...entry,
      },
      ...tournament.adminAudit,
    ],
  };
}

export { getUserAgent, fetchIpAddress };
export type { Admin } from "../types";
