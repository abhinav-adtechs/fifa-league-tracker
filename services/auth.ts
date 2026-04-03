import { Capacitor } from '@capacitor/core';
import { Admin, PlatformState, Tournament, TournamentAdmin, TournamentAdminAudit } from '../types';
import { supabase } from './supabaseClient';
import { sessionStorage } from './sessionStorage';

export interface LoginAuditEntry {
  id: number;
  admin_id: string | null;
  admin_name_snapshot: string;
  login_at: string;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
}

const GLOBAL_AUTH_STORAGE_KEY = 'global_admin_auth';
const LEGACY_TOURNAMENT_ID = 'superjoin-fc26-league';
const LEGACY_TOURNAMENT_NAME = 'superjoin fc26 league';

export const LEGACY_ADMIN_SEEDS = [
  { name: 'manan', password: 'football' },
  { name: 'abhinav', password: 'champion' },
  { name: 'sagar', password: 'defender' },
  { name: 'karan', password: 'midfield' },
  { name: 'mukul', password: 'killerindiafc' },
];

function getUserAgent(): string {
  if (Capacitor.isNativePlatform()) {
    return 'FIFA League Tracker iOS';
  }
  return typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
}

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password: string): Promise<string> {
  return sha256(password.trim());
}

async function fetchIpAddress(): Promise<string | null> {
  return fetch('https://api.ipify.org?format=json')
    .then((res) => res.json())
    .then((data) => data.ip as string)
    .catch(() => null);
}

export async function buildSeedTournamentAdmins(): Promise<TournamentAdmin[]> {
  const now = Date.now();
  return Promise.all(
    LEGACY_ADMIN_SEEDS.map(async (seed, index) => ({
      id: `seed-admin-${index}-${seed.name}`,
      name: seed.name,
      passwordHash: await hashPassword(seed.password),
      createdAt: now + index,
    }))
  );
}

function normalizeAdminName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function isLegacyTournament(tournament: Tournament): boolean {
  return (
    tournament.id === LEGACY_TOURNAMENT_ID ||
    normalizeAdminName(tournament.name) === LEGACY_TOURNAMENT_NAME
  );
}

export async function reconcileLegacyTournamentAdmins(tournament: Tournament): Promise<Tournament> {
  if (!isLegacyTournament(tournament)) {
    return tournament;
  }

  const seededAdmins = await buildSeedTournamentAdmins();
  const seedNameSet = new Set(seededAdmins.map((admin) => normalizeAdminName(admin.name)));
  const preservedAdmins = tournament.admins.filter((admin) => !seedNameSet.has(normalizeAdminName(admin.name)));

  const mergedSeedAdmins = seededAdmins.map((seededAdmin) => {
    const existing = tournament.admins.find(
      (admin) => normalizeAdminName(admin.name) === normalizeAdminName(seededAdmin.name)
    );

    return existing
      ? {
          ...existing,
          passwordHash: seededAdmin.passwordHash,
        }
      : seededAdmin;
  });

  const mergedAdmins = [...preservedAdmins, ...mergedSeedAdmins];
  const changed =
    mergedAdmins.length !== tournament.admins.length ||
    mergedAdmins.some((admin, index) => {
      const current = tournament.admins[index];
      return !current || current.name !== admin.name || current.passwordHash !== admin.passwordHash;
    });

  if (!changed) {
    return tournament;
  }

  return {
    ...tournament,
    admins: mergedAdmins,
    updatedAt: Date.now(),
  };
}

export async function reconcilePlatformAdmins(platform: PlatformState): Promise<PlatformState> {
  const tournaments = await Promise.all(
    platform.tournaments.map((tournament) => reconcileLegacyTournamentAdmins(tournament))
  );

  const changed = tournaments.some((tournament, index) => tournament !== platform.tournaments[index]);
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
    })
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

async function loginWithSupabase(password: string): Promise<{ success: boolean; admin?: Admin; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data: adminData, error } = await supabase.rpc('verify_admin_password', {
      plain_password: password.trim(),
    });

    if (error) {
      console.error('verify_admin_password RPC:', error);
      return { success: false, error: error.message || 'Login failed' };
    }

    const matched = Array.isArray(adminData) ? adminData[0] : null;
    if (!matched || String(matched.name).toLowerCase().trim() !== 'abhinav') {
      return { success: false, error: 'Invalid global admin password' };
    }

    const admin: Admin = { id: matched.id, name: matched.name };
    await saveGlobalSession(admin);
    return { success: true, admin };
  } catch (error) {
    console.error('Global login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

async function verifyLegacyAdminWithSupabase(adminName: string, password: string): Promise<Admin | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data: adminData, error } = await supabase.rpc('verify_admin_password', {
      plain_password: password.trim(),
    });

    if (error) {
      console.error('verify_admin_password RPC (legacy tournament):', error);
      return null;
    }

    const matched = Array.isArray(adminData) ? adminData[0] : null;
    if (!matched) {
      return null;
    }

    if (normalizeAdminName(String(matched.name)) !== normalizeAdminName(adminName)) {
      return null;
    }

    return {
      id: String(matched.id),
      name: String(matched.name),
    };
  } catch (error) {
    console.error('Legacy tournament Supabase verification error:', error);
    return null;
  }
}

async function loginWithFallback(password: string): Promise<{ success: boolean; admin?: Admin; error?: string }> {
  const matched = LEGACY_ADMIN_SEEDS.find(
    (seed) => seed.name === 'abhinav' && seed.password === password.trim()
  );

  if (!matched) {
    return { success: false, error: 'Invalid global admin password' };
  }

  const admin: Admin = { id: 'global-admin-abhinav', name: 'abhinav' };
  await saveGlobalSession(admin);
  return { success: true, admin };
}

export const globalAuth = {
  isAuthenticated: async (): Promise<boolean> => {
    return Boolean(await readGlobalSession());
  },

  getCurrentAdmin: async (): Promise<Admin | null> => {
    return readGlobalSession();
  },

  login: async (password: string): Promise<{ success: boolean; admin?: Admin; error?: string }> => {
    if (supabase) {
      const result = await loginWithSupabase(password);
      if (result.success || result.error !== 'Supabase not configured') {
        return result;
      }
    }
    return loginWithFallback(password);
  },

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
  password: string
): Promise<TournamentAdmin | null> {
  const passwordHash = await hashPassword(password);
  const matched = tournament.admins.find(
    (admin) =>
      admin.name.toLowerCase().trim() === adminName.toLowerCase().trim() &&
      admin.passwordHash === passwordHash
  );
  if (matched) return matched;

  if (isLegacyTournament(tournament)) {
    const supabaseMatched = await verifyLegacyAdminWithSupabase(adminName, password);
    if (supabaseMatched) {
      return (
        tournament.admins.find(
          (admin) => normalizeAdminName(admin.name) === normalizeAdminName(supabaseMatched.name)
        ) ?? {
          id: supabaseMatched.id,
          name: supabaseMatched.name,
          passwordHash,
          createdAt: Date.now(),
        }
      );
    }

    const fallback = LEGACY_ADMIN_SEEDS.find(
      (seed) =>
        normalizeAdminName(seed.name) === normalizeAdminName(adminName) &&
        seed.password === password.trim()
    );

    if (fallback) {
      return (
        tournament.admins.find(
          (admin) => normalizeAdminName(admin.name) === normalizeAdminName(fallback.name)
        ) ?? {
          id: `legacy-admin-${fallback.name}`,
          name: fallback.name,
          passwordHash,
          createdAt: Date.now(),
        }
      );
    }
  }

  return null;
}

export function appendTournamentAdminAudit(
  tournament: Tournament,
  entry: Omit<TournamentAdminAudit, 'id' | 'timestamp'>
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
export type { Admin } from '../types';
