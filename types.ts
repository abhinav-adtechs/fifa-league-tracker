export interface Player {
  id: string;
  name: string;
  avatarUrl: string; // New field for profile picture
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number; 
  ga: number; 
  gd: number; 
  points: number;
  ppg: number; // Points Per Game (Normalized)
  form: ('W' | 'D' | 'L')[];
}

export interface Match {
  id: string;
  timestamp: number;
  player1Id: string;
  player2Id: string;
  score1: number;
  score2: number;
  commentary?: string;
}

export enum Tab {
  DASHBOARD = 'DASHBOARD',
  STANDINGS = 'STANDINGS',
  MATCHES = 'MATCHES',
  MY_PERFORMANCE = 'MY_PERFORMANCE',
  PLAYERS = 'PLAYERS',
  LOGIN = 'LOGIN'
}

export type LeagueMode = 'ABSOLUTE' | 'NORMALIZED';

/** Standings tab: Normalised (comprehensive formula), PPG, or raw Table */
export type StandingsView = 'NORMALISED' | 'PPG' | 'TABLE';

/** League-level stats: aggregate over all matches (not per-player). */
export interface LeagueStats {
  totalMatches: number;
  totalGoals: number;
  avgGoalsPerMatch: number;
  totalDraws: number;
  totalHomeWins: number;  // player1 wins
  totalAwayWins: number;  // player2 wins
}
