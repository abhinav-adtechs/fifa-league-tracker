import {
  Match,
  MatchStage,
  PlatformState,
  Player,
  PlayerProfile,
  Tournament,
  TournamentFixture,
  TournamentParticipant,
  TournamentSettings,
  TournamentType,
} from '../types';
import { computePlayersWithStats } from './standings';

export const DEFAULT_TOURNAMENT_SETTINGS: TournamentSettings = {
  matchesPerOpponent: 1,
  matchDurationMinutes: 12,
  bufferMinutes: 3,
  qualifierCount: 4,
};

export function getPlayerAvatar(name: string): string {
  const nameLower = name.toLowerCase().trim();
  const avatarMap: Record<string, string> = {
    abhinav: 'https://img.a.transfermarkt.technology/portrait/header/433179-1672832000.jpg?lm=1',
    karan: 'https://img.a.transfermarkt.technology/portrait/header/342229-1672832000.jpg?lm=1',
    manan: 'https://img.a.transfermarkt.technology/portrait/header/38253-1672832000.jpg?lm=1',
    sagar: 'https://img.a.transfermarkt.technology/portrait/header/418560-1672832000.jpg?lm=1',
    ayush: 'https://img.a.transfermarkt.technology/portrait/header/636999-1672832000.jpg?lm=1',
    mukul: 'https://img.a.transfermarkt.technology/portrait/header/234035-1672832000.jpg?lm=1',
  };

  if (avatarMap[nameLower]) return avatarMap[nameLower];
  for (const [key, value] of Object.entries(avatarMap)) {
    if (nameLower.includes(key) || key.includes(nameLower)) return value;
  }

  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=fae100,6b46c1,1a1625`;
}

export function tournamentTypeLabel(type: TournamentType): string {
  switch (type) {
    case 'OPEN_LEAGUE':
      return 'Open League';
    case 'LEAGUE':
      return 'League';
    case 'KNOCKOUT':
      return 'Knockout';
    case 'LEAGUE_KNOCKOUT':
      return 'League + Knockout';
    default:
      return type;
  }
}

export function supportsTable(type: TournamentType): boolean {
  return type === 'OPEN_LEAGUE' || type === 'LEAGUE' || type === 'LEAGUE_KNOCKOUT';
}

export function supportsBracket(type: TournamentType): boolean {
  return type === 'KNOCKOUT' || type === 'LEAGUE_KNOCKOUT';
}

export function isOpenEnded(type: TournamentType): boolean {
  return type === 'OPEN_LEAGUE';
}

export function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function profileToParticipant(profile: PlayerProfile, teamName?: string, seed?: number): TournamentParticipant {
  return {
    id: crypto.randomUUID(),
    profileId: profile.id,
    name: profile.name,
    avatarUrl: profile.avatarUrl,
    teamName: teamName?.trim() || 'TBD FC',
    seed,
    joinedAt: Date.now(),
  };
}

export function createPlayerProfile(name: string): PlayerProfile {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    avatarUrl: getPlayerAvatar(name.trim()),
    createdAt: Date.now(),
  };
}

export function buildLegacyPlayerPool(players: Player[]): PlayerProfile[] {
  const seen = new Set<string>();
  const pool: PlayerProfile[] = [];

  for (const player of players) {
    const key = normalizeName(player.name);
    if (seen.has(key)) continue;
    seen.add(key);
    pool.push({
      id: player.id,
      name: player.name,
      avatarUrl: player.avatarUrl || getPlayerAvatar(player.name),
      createdAt: Date.now(),
    });
  }

  return pool;
}

function getLegacyParticipants(players: Player[]): TournamentParticipant[] {
  return players.map((player) => ({
    id: player.id,
    profileId: player.id,
    name: player.name,
    avatarUrl: player.avatarUrl || getPlayerAvatar(player.name),
    teamName: 'Superjoin FC',
    joinedAt: Date.now(),
  }));
}

export function createPlatformFromLegacy(
  players: Player[],
  matches: Match[],
  seededAdmins: Tournament['admins']
): PlatformState {
  const createdAt = Date.now();
  const initialTournament: Tournament = {
    id: 'superjoin-fc26-league',
    name: 'Superjoin FC26 League',
    type: 'OPEN_LEAGUE',
    participants: getLegacyParticipants(players),
    matches: matches.map((match) => ({
      ...match,
      tournamentId: 'superjoin-fc26-league',
      stage: 'OPEN' as MatchStage,
    })),
    fixtures: [],
    admins: seededAdmins,
    adminAudit: [],
    settings: { ...DEFAULT_TOURNAMENT_SETTINGS },
    createdAt,
    updatedAt: createdAt,
  };

  return {
    version: 2,
    lastOpenedTournamentId: initialTournament.id,
    tournaments: [initialTournament],
    playerPool: buildLegacyPlayerPool(players),
    legacyMigrated: true,
  };
}

export function getTournamentTableMatches(tournament: Tournament): Match[] {
  if (tournament.type === 'OPEN_LEAGUE') {
    return tournament.matches.filter((match) => (match.stage ?? 'OPEN') === 'OPEN');
  }

  return tournament.matches.filter((match) => match.stage === 'LEAGUE');
}

export function getTournamentStatsMatches(tournament: Tournament): Match[] {
  return tournament.matches;
}

export function deriveTournamentPlayers(
  tournament: Tournament,
  matches: Match[] = getTournamentStatsMatches(tournament)
): Player[] {
  const basePlayers: Player[] = tournament.participants.map((participant) => ({
    id: participant.id,
    name: participant.name,
    avatarUrl: participant.avatarUrl,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
    ppg: 0,
    form: [],
  }));

  return computePlayersWithStats(basePlayers, matches);
}

export function generateLeagueFixtures(
  participants: TournamentParticipant[],
  matchesPerOpponent: number
): TournamentFixture[] {
  if (participants.length < 2) return [];

  const ids = participants.map((participant) => participant.id);
  const working = ids.length % 2 === 0 ? [...ids] : [...ids, null];
  const roundCount = working.length - 1;
  const half = working.length / 2;
  const fixtures: TournamentFixture[] = [];
  let roundNumber = 1;

  for (let cycle = 0; cycle < matchesPerOpponent; cycle++) {
    let rotation = [...working];
    for (let round = 0; round < roundCount; round++) {
      const left = rotation.slice(0, half);
      const right = rotation.slice(half).reverse();

      for (let slot = 0; slot < half; slot++) {
        const player1 = left[slot];
        const player2 = right[slot];
        if (!player1 || !player2) continue;

        fixtures.push({
          id: crypto.randomUUID(),
          stage: 'LEAGUE',
          roundName: `Round ${roundNumber}`,
          roundIndex: roundNumber - 1,
          matchIndex: slot,
          participant1Id: cycle % 2 === 0 ? player1 : player2,
          participant2Id: cycle % 2 === 0 ? player2 : player1,
          status: 'READY',
          allowDraw: true,
        });
      }

      const fixed = rotation[0];
      const rest = rotation.slice(1);
      rest.unshift(rest.pop() ?? null);
      rotation = [fixed, ...rest];
      roundNumber += 1;
    }
  }

  return fixtures;
}

function nextPowerOfTwo(value: number): number {
  let power = 1;
  while (power < value) power *= 2;
  return power;
}

export function createKnockoutFixtures(orderedParticipantIds: string[]): TournamentFixture[] {
  if (orderedParticipantIds.length < 2) return [];

  const bracketSize = nextPowerOfTwo(orderedParticipantIds.length);
  const slots: Array<string | undefined> = [
    ...orderedParticipantIds,
    ...Array.from({ length: bracketSize - orderedParticipantIds.length }, () => undefined),
  ];
  const fixtures: TournamentFixture[] = [];
  const rounds = Math.log2(bracketSize);
  let previousRoundIds: string[] = [];

  for (let round = 0; round < rounds; round++) {
    const fixtureCount = bracketSize / Math.pow(2, round + 1);
    const currentRoundIds: string[] = [];
    const roundName =
      rounds === 1
        ? 'Final'
        : round === rounds - 1
          ? 'Final'
          : round === rounds - 2
            ? 'Semi Final'
            : round === rounds - 3
              ? 'Quarter Final'
              : `Round ${round + 1}`;

    for (let index = 0; index < fixtureCount; index++) {
      const fixture: TournamentFixture = {
        id: crypto.randomUUID(),
        stage: 'KNOCKOUT',
        roundName,
        roundIndex: round,
        matchIndex: index,
        status: 'PENDING',
        allowDraw: false,
        label: `${roundName} ${index + 1}`,
      };

      if (round === 0) {
        fixture.participant1Id = slots[index * 2];
        fixture.participant2Id = slots[index * 2 + 1];
      } else {
        fixture.sourceFixtureIds = [previousRoundIds[index * 2], previousRoundIds[index * 2 + 1]];
      }

      currentRoundIds.push(fixture.id);
      fixtures.push(fixture);
    }

    previousRoundIds = currentRoundIds;
  }

  return advanceKnockoutFixtures(fixtures);
}

export function advanceKnockoutFixtures(fixtures: TournamentFixture[]): TournamentFixture[] {
  const sorted = [...fixtures].sort((a, b) => a.roundIndex - b.roundIndex || a.matchIndex - b.matchIndex);
  const resolved = new Map<string, TournamentFixture>();

  for (const fixture of sorted) {
    let nextFixture: TournamentFixture = { ...fixture };

    if (nextFixture.stage === 'KNOCKOUT' && nextFixture.sourceFixtureIds?.length) {
      const [sourceA, sourceB] = nextFixture.sourceFixtureIds;
      const sourceFixtureA = sourceA ? resolved.get(sourceA) : undefined;
      const sourceFixtureB = sourceB ? resolved.get(sourceB) : undefined;
      nextFixture = {
        ...nextFixture,
        participant1Id: sourceFixtureA?.winnerId,
        participant2Id: sourceFixtureB?.winnerId,
      };
    }

    if (!nextFixture.matchId) {
      if (nextFixture.participant1Id && nextFixture.participant2Id) {
        nextFixture = {
          ...nextFixture,
          status: 'READY',
          winnerId: undefined,
        };
      } else if (nextFixture.participant1Id || nextFixture.participant2Id) {
        nextFixture = {
          ...nextFixture,
          status: 'BYE',
          winnerId: nextFixture.participant1Id || nextFixture.participant2Id,
        };
      } else {
        nextFixture = {
          ...nextFixture,
          status: 'PENDING',
          winnerId: undefined,
        };
      }
    }

    resolved.set(nextFixture.id, nextFixture);
  }

  return fixtures.map((fixture) => resolved.get(fixture.id) ?? fixture);
}

export function getQualifiedParticipants(tournament: Tournament): TournamentParticipant[] {
  const standings = deriveTournamentPlayers(tournament, getTournamentTableMatches(tournament));
  const qualifierCount = Math.max(2, Math.min(tournament.settings.qualifierCount, standings.length));
  const topIds = standings.slice(0, qualifierCount).map((player) => player.id);
  return topIds
    .map((id) => tournament.participants.find((participant) => participant.id === id))
    .filter(Boolean) as TournamentParticipant[];
}

export function createLeagueKnockoutBracket(
  tournament: Tournament,
  orderedQualifiedIds: string[]
): Tournament {
  const knockoutFixtures = createKnockoutFixtures(orderedQualifiedIds);

  return {
    ...tournament,
    fixtures: [
      ...tournament.fixtures.filter((fixture) => fixture.stage !== 'KNOCKOUT'),
      ...knockoutFixtures,
    ],
    updatedAt: Date.now(),
  };
}

export function recordFixtureResult(
  tournament: Tournament,
  fixtureId: string,
  score1: number,
  score2: number
): Tournament {
  const fixture = tournament.fixtures.find((item) => item.id === fixtureId);
  if (!fixture || !fixture.participant1Id || !fixture.participant2Id) return tournament;
  if (!fixture.allowDraw && score1 === score2) {
    throw new Error('Knockout matches cannot end in a draw.');
  }

  const winnerId =
    fixture.stage === 'KNOCKOUT'
      ? score1 > score2
        ? fixture.participant1Id
        : fixture.participant2Id
      : undefined;

  const match: Match = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    tournamentId: tournament.id,
    fixtureId: fixture.id,
    player1Id: fixture.participant1Id,
    player2Id: fixture.participant2Id,
    score1,
    score2,
    stage: fixture.stage,
    roundName: fixture.roundName,
    winnerId,
  };

  let fixtures = tournament.fixtures.map((item) =>
    item.id === fixture.id
      ? {
          ...item,
          status: 'COMPLETED' as const,
          matchId: match.id,
          winnerId,
        }
      : item
  );

  fixtures = advanceKnockoutFixtures(fixtures);

  return {
    ...tournament,
    matches: [match, ...tournament.matches],
    fixtures,
    updatedAt: Date.now(),
  };
}

export function recordOpenMatch(
  tournament: Tournament,
  participant1Id: string,
  participant2Id: string,
  score1: number,
  score2: number
): Tournament {
  const match: Match = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    tournamentId: tournament.id,
    player1Id: participant1Id,
    player2Id: participant2Id,
    score1,
    score2,
    stage: 'OPEN',
  };

  return {
    ...tournament,
    matches: [match, ...tournament.matches],
    updatedAt: Date.now(),
  };
}

export function getReadyFixtures(tournament: Tournament): TournamentFixture[] {
  return tournament.fixtures.filter((fixture) => fixture.status === 'READY' && !fixture.matchId);
}

export function isLeagueComplete(tournament: Tournament): boolean {
  const leagueFixtures = tournament.fixtures.filter((fixture) => fixture.stage === 'LEAGUE');
  if (leagueFixtures.length === 0) return false;
  return leagueFixtures.every((fixture) => fixture.matchId || fixture.status === 'BYE');
}

export function getTournamentProgress(tournament: Tournament): {
  completedMatches: number;
  totalPlannedMatches: number;
  completionPercent: number;
  remainingMatches: number;
  remainingMinutes: number;
} | null {
  if (tournament.type === 'OPEN_LEAGUE') return null;

  const leaguePlanned = tournament.fixtures.filter((fixture) => fixture.stage === 'LEAGUE').length;
  const leagueCompleted = tournament.matches.filter((match) => match.stage === 'LEAGUE').length;
  const knockoutPlanned =
    tournament.type === 'KNOCKOUT'
      ? Math.max(0, tournament.participants.length - 1)
      : tournament.type === 'LEAGUE_KNOCKOUT'
        ? Math.max(0, tournament.settings.qualifierCount - 1)
        : 0;
  const knockoutCompleted = tournament.matches.filter((match) => match.stage === 'KNOCKOUT').length;

  const totalPlannedMatches = leaguePlanned + knockoutPlanned;
  const completedMatches = leagueCompleted + knockoutCompleted;
  const remainingMatches = Math.max(0, totalPlannedMatches - completedMatches);
  const remainingMinutes =
    remainingMatches * (tournament.settings.matchDurationMinutes + tournament.settings.bufferMinutes);
  const completionPercent =
    totalPlannedMatches > 0 ? Math.round((completedMatches / totalPlannedMatches) * 100) : 0;

  return {
    completedMatches,
    totalPlannedMatches,
    completionPercent,
    remainingMatches,
    remainingMinutes,
  };
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
