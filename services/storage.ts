import { Player, Match } from '../types';

const STORAGE_KEYS = {
  PLAYERS: 'fifa_league_players_v2',
  MATCHES: 'fifa_league_matches_v2'
};

// Simulated Database Service
// In a real production app, you would replace these localStorage calls with API calls to a backend (e.g., Firebase, Supabase, Postgres)
export const db = {
  getPlayers: (): Player[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLAYERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("DB Error", e);
      return [];
    }
  },

  savePlayers: (players: Player[]) => {
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
  },

  getMatches: (): Match[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MATCHES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("DB Error", e);
      return [];
    }
  },

  saveMatches: (matches: Match[]) => {
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
  }
};
