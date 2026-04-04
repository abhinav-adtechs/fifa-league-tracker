export interface Player {
  id: string;
  name: string;
  avatarUrl: string;
  /** In-tournament club/team label when derived from squad data. */
  teamName?: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  ppg: number;
  form: ("W" | "D" | "L")[];
}

export type MatchStage = "OPEN" | "LEAGUE" | "KNOCKOUT";

export interface Match {
  id: string;
  timestamp: number;
  player1Id: string;
  player2Id: string;
  score1: number;
  score2: number;
  commentary?: string;
  tournamentId?: string;
  fixtureId?: string;
  stage?: MatchStage;
  roundName?: string;
  winnerId?: string;
}

export type WorkspaceTab =
  | "TABLE"
  | "BRACKET"
  | "MATCHES"
  | "PERFORMANCE"
  | "STATS"
  | "SQUAD"
  | "ADMIN";
export type TournamentType =
  | "OPEN_LEAGUE"
  | "LEAGUE"
  | "KNOCKOUT"
  | "LEAGUE_KNOCKOUT";
export type FixtureStatus = "PENDING" | "READY" | "COMPLETED" | "BYE";

export interface PlayerProfile {
  id: string;
  name: string;
  avatarUrl: string;
  createdAt: number;
}

export interface TournamentParticipant {
  id: string;
  profileId: string;
  name: string;
  avatarUrl: string;
  teamName: string;
  groupName?: string;
  seed?: number;
  joinedAt: number;
}

export interface TournamentFixture {
  id: string;
  stage: Exclude<MatchStage, "OPEN">;
  roundName: string;
  roundIndex: number;
  matchIndex: number;
  groupName?: string;
  participant1Id?: string;
  participant2Id?: string;
  sourceFixtureIds?: string[];
  sourceOutcomes?: Array<"WINNER" | "LOSER">;
  status: FixtureStatus;
  allowDraw: boolean;
  winnerId?: string;
  matchId?: string;
  label?: string;
}

export interface TournamentSettings {
  matchesPerOpponent: number;
  matchDurationMinutes: number;
  bufferMinutes: number;
  qualifierCount: number;
  groupCount: number;
}

export interface TournamentAdmin {
  id: string;
  name: string;
  passwordHash: string;
  createdAt: number;
}

export interface TournamentAdminAudit {
  id: string;
  adminId: string | null;
  adminNameSnapshot: string;
  success: boolean;
  timestamp: number;
}

export interface Tournament {
  id: string;
  name: string;
  type: TournamentType;
  /** Planning size for schedule previews; actual squad is `participants.length`. */
  targetPlayerCount?: number;
  trophyImage: string;
  participants: TournamentParticipant[];
  matches: Match[];
  fixtures: TournamentFixture[];
  admins: TournamentAdmin[];
  adminAudit: TournamentAdminAudit[];
  settings: TournamentSettings;
  createdAt: number;
  updatedAt: number;
}

export interface PlatformState {
  version: number;
  lastOpenedTournamentId: string | null;
  tournaments: Tournament[];
  playerPool: PlayerProfile[];
  legacyMigrated: boolean;
}

export interface Admin {
  id: string;
  name: string;
}

export type StandingsView = "NORMALISED" | "PPG" | "TABLE";

export interface LeagueStats {
  totalMatches: number;
  totalGoals: number;
  avgGoalsPerMatch: number;
  totalDraws: number;
  totalHomeWins: number;
  totalAwayWins: number;
}
