import { Match, PlatformState, Player, PlayerProfile } from '../types';
import { supabase } from './supabaseClient';

const STATE_ID = 'default';
const PLATFORM_KEY = 'fifa_platform_state';
const PLAYER_POOL_KEY = 'fifa_player_pool';

type PlatformEnvelope = PlatformState & { version: number };

function canUseLocalStorage() {
  return typeof localStorage !== 'undefined';
}

function isPlatformEnvelope(value: unknown): value is PlatformEnvelope {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'version' in value &&
    'tournaments' in value &&
    'playerPool' in value
  );
}

async function readPlayersState(): Promise<unknown> {
  if (!supabase) {
    if (!canUseLocalStorage()) return null;
    const stored = localStorage.getItem(PLAYER_POOL_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  const { data, error } = await supabase
    .from('players_state')
    .select('players')
    .eq('id', STATE_ID)
    .maybeSingle();

  if (error) {
    console.error('DB Error (readPlayersState)', error);
    return null;
  }

  return data?.players ?? null;
}

async function readMatchesState(): Promise<unknown> {
  if (!supabase) {
    if (!canUseLocalStorage()) return null;
    const stored = localStorage.getItem(PLATFORM_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  const { data, error } = await supabase
    .from('matches_state')
    .select('matches')
    .eq('id', STATE_ID)
    .maybeSingle();

  if (error) {
    console.error('DB Error (readMatchesState)', error);
    return null;
  }

  return data?.matches ?? null;
}

async function writePlayersState(playerPool: PlayerProfile[]): Promise<void> {
  if (!supabase) {
    if (canUseLocalStorage()) {
      localStorage.setItem(PLAYER_POOL_KEY, JSON.stringify(playerPool));
    }
    return;
  }

  const { error } = await supabase
    .from('players_state')
    .upsert(
      {
        id: STATE_ID,
        players: playerPool,
      },
      { onConflict: 'id' }
    );

  if (error) {
    console.error('DB Error (writePlayersState)', error);
  }
}

async function writeMatchesState(platform: PlatformState): Promise<void> {
  if (!supabase) {
    if (canUseLocalStorage()) {
      localStorage.setItem(PLATFORM_KEY, JSON.stringify(platform));
    }
    return;
  }

  const { error } = await supabase
    .from('matches_state')
    .upsert(
      {
        id: STATE_ID,
        matches: platform,
      },
      { onConflict: 'id' }
    );

  if (error) {
    console.error('DB Error (writeMatchesState)', error);
  }
}

export const db = {
  getLegacyPlayers: async (): Promise<Player[]> => {
    const raw = await readPlayersState();
    if (!raw || isPlatformEnvelope(raw)) return [];
    return Array.isArray(raw) ? (raw as Player[]) : [];
  },

  getLegacyMatches: async (): Promise<Match[]> => {
    const raw = await readMatchesState();
    if (!raw || isPlatformEnvelope(raw)) return [];
    return Array.isArray(raw) ? (raw as Match[]) : [];
  },

  getPlatformState: async (): Promise<PlatformState | null> => {
    const rawPlatform = await readMatchesState();
    if (!isPlatformEnvelope(rawPlatform)) return null;

    const rawPlayerPool = await readPlayersState();
    return {
      ...rawPlatform,
      playerPool: Array.isArray(rawPlayerPool) ? (rawPlayerPool as PlayerProfile[]) : rawPlatform.playerPool,
    };
  },

  savePlatformState: async (platform: PlatformState): Promise<void> => {
    await Promise.all([writePlayersState(platform.playerPool), writeMatchesState(platform)]);
  },
};
