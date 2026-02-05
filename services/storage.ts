import { Player, Match } from '../types';
import { supabase } from './supabaseClient';

const STATE_ID = 'default';

export const db = {
  getPlayers: async (): Promise<Player[]> => {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('players_state')
      .select('players')
      .eq('id', STATE_ID)
      .maybeSingle();

    if (error) {
      console.error('DB Error (getPlayers)', error);
      return [];
    }

    return (data?.players as Player[]) ?? [];
  },

  savePlayers: async (players: Player[]): Promise<void> => {
    if (!supabase) return;

    const { error } = await supabase
      .from('players_state')
      .upsert(
        {
          id: STATE_ID,
          players
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('DB Error (savePlayers)', error);
    }
  },

  getMatches: async (): Promise<Match[]> => {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('matches_state')
      .select('matches')
      .eq('id', STATE_ID)
      .maybeSingle();

    if (error) {
      console.error('DB Error (getMatches)', error);
      return [];
    }

    return (data?.matches as Match[]) ?? [];
  },

  saveMatches: async (matches: Match[]): Promise<void> => {
    if (!supabase) return;

    const { error } = await supabase
      .from('matches_state')
      .upsert(
        {
          id: STATE_ID,
          matches
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('DB Error (saveMatches)', error);
    }
  }
};

