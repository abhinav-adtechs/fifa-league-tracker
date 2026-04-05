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
} from "../types";
import { computePlayersWithStats } from "./standings";
import { getSortedByView } from "./standings";

export const DEFAULT_TOURNAMENT_SETTINGS: TournamentSettings = {
  matchesPerOpponent: 1,
  matchDurationMinutes: 15,
  bufferMinutes: 5,
  qualifierCount: 4,
  groupCount: 1,
};

export const TROPHY_IMAGES = [
  {
    label: "FA Cup",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/FA%20Cup%20Trophy%20at%20Manchester%20National%20Football%20Museum%20%28Ank%20Kumar%29%2001.jpg",
  },
  {
    label: "Champions League",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/2005%20Champions%20League%20trophy%20in%20Anfield%20museum.jpg",
  },
  {
    label: "Premier League",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Trophy%20Premier%20League.jpg",
  },
] as const;

export function getDefaultTrophyImage(): string {
  return TROPHY_IMAGES[0].image;
}

export function getPlayerAvatar(name: string): string {
  const nameLower = name.toLowerCase().trim();
  const avatarMap: Record<string, string> = {
    abhinav:
      "https://img.a.transfermarkt.technology/portrait/header/433179-1672832000.jpg?lm=1",
    karan:
      "https://img.a.transfermarkt.technology/portrait/header/342229-1672832000.jpg?lm=1",
    manan:
      "https://img.a.transfermarkt.technology/portrait/header/38253-1672832000.jpg?lm=1",
    sagar:
      "https://img.a.transfermarkt.technology/portrait/header/418560-1672832000.jpg?lm=1",
    ayush:
      "https://img.a.transfermarkt.technology/portrait/header/636999-1672832000.jpg?lm=1",
    mukul:
      "https://img.a.transfermarkt.technology/portrait/header/234035-1672832000.jpg?lm=1",
  };

  if (avatarMap[nameLower]) return avatarMap[nameLower];
  for (const [key, value] of Object.entries(avatarMap)) {
    if (nameLower.includes(key) || key.includes(nameLower)) return value;
  }

  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=fae100,6b46c1,1a1625`;
}

export function tournamentTypeLabel(type: TournamentType): string {
  switch (type) {
    case "OPEN_LEAGUE":
      return "Open League";
    case "LEAGUE":
      return "League";
    case "KNOCKOUT":
      return "Knockout";
    case "LEAGUE_KNOCKOUT":
      return "League + Knockout";
    default:
      return type;
  }
}

export function supportsTable(type: TournamentType): boolean {
  return (
    type === "OPEN_LEAGUE" || type === "LEAGUE" || type === "LEAGUE_KNOCKOUT"
  );
}

/** League + knockout uses a classic points table for the league stage only. */
export function leagueStageStandingsTableOnly(type: TournamentType): boolean {
  return type === "LEAGUE_KNOCKOUT";
}

export function supportsBracket(type: TournamentType): boolean {
  return type === "KNOCKOUT" || type === "LEAGUE_KNOCKOUT";
}

export function isOpenEnded(type: TournamentType): boolean {
  return type === "OPEN_LEAGUE";
}

export function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

export function profileToParticipant(
  profile: PlayerProfile,
  teamName?: string,
  seed?: number,
  groupName?: string,
): TournamentParticipant {
  return {
    id: crypto.randomUUID(),
    profileId: profile.id,
    name: profile.name,
    avatarUrl: profile.avatarUrl,
    teamName: teamName?.trim() || "TBD FC",
    groupName,
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
    teamName: "Superjoin FC",
    groupName: undefined,
    joinedAt: Date.now(),
  }));
}

export function createPlatformFromLegacy(
  players: Player[],
  matches: Match[],
  seededAdmins: Tournament["admins"],
): PlatformState {
  const createdAt = Date.now();
  const initialTournament: Tournament = {
    id: "superjoin-fc26-league",
    name: "Superjoin FC26 League",
    type: "OPEN_LEAGUE",
    trophyImage: getDefaultTrophyImage(),
    participants: getLegacyParticipants(players),
    matches: matches.map((match) => ({
      ...match,
      tournamentId: "superjoin-fc26-league",
      stage: "OPEN" as MatchStage,
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
  if (tournament.type === "OPEN_LEAGUE") {
    return tournament.matches.filter(
      (match) => (match.stage ?? "OPEN") === "OPEN",
    );
  }

  return tournament.matches.filter((match) => match.stage === "LEAGUE");
}

export function getTournamentStatsMatches(tournament: Tournament): Match[] {
  return tournament.matches;
}

/** Effective knockout qualifier count (matches seeding logic). */
export function getEffectiveKnockoutQualifierCount(
  tournament: Tournament,
): number {
  return Math.max(
    2,
    Math.min(
      tournament.settings.qualifierCount,
      tournament.participants.length,
    ),
  );
}

export function deriveTournamentPlayers(
  tournament: Tournament,
  matches: Match[] = getTournamentStatsMatches(tournament),
): Player[] {
  const basePlayers: Player[] = tournament.participants.map((participant) => ({
    id: participant.id,
    name: participant.name,
    avatarUrl: participant.avatarUrl,
    teamName: participant.teamName,
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

export function getGroupStandings(
  tournament: Tournament,
): Array<{ groupName: string; players: Player[]; matches: Match[] }> {
  const groupedParticipants = tournament.participants.reduce<
    Map<string, TournamentParticipant[]>
  >((map, participant) => {
    const key = participant.groupName ?? "League";
    const current = map.get(key) ?? [];
    current.push(participant);
    map.set(key, current);
    return map;
  }, new Map());

  return Array.from(groupedParticipants.entries()).map(
    ([groupName, participants]) => {
      const participantIds = new Set(
        participants.map((participant) => participant.id),
      );
      const matches = getTournamentTableMatches(tournament).filter(
        (match) =>
          participantIds.has(match.player1Id) &&
          participantIds.has(match.player2Id),
      );

      return {
        groupName,
        players: getSortedByView(
          deriveTournamentPlayers(
            {
              ...tournament,
              participants,
            },
            matches,
          ),
          "TABLE",
        ),
        matches,
      };
    },
  );
}

export function generateLeagueFixtures(
  participants: TournamentParticipant[],
  matchesPerOpponent: number,
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
          stage: "LEAGUE",
          roundName: `Round ${roundNumber}`,
          roundIndex: roundNumber - 1,
          matchIndex: slot,
          participant1Id: cycle % 2 === 0 ? player1 : player2,
          participant2Id: cycle % 2 === 0 ? player2 : player1,
          status: "READY",
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

export function getEffectiveGroupCount(
  playerCount: number,
  requestedGroupCount: number,
): number {
  if (playerCount < 4) return 1;
  return Math.max(
    1,
    Math.min(requestedGroupCount || 1, Math.floor(playerCount / 2)),
  );
}

export function getGroupName(index: number): string {
  return `Group ${String.fromCharCode(65 + index)}`;
}

export function assignGroupsToParticipants(
  participants: TournamentParticipant[],
  requestedGroupCount: number,
): TournamentParticipant[] {
  const groupCount = getEffectiveGroupCount(
    participants.length,
    requestedGroupCount,
  );
  if (groupCount <= 1) {
    return participants.map((participant, index) => ({
      ...participant,
      seed: participant.seed ?? index + 1,
      groupName: undefined,
    }));
  }

  const groupNames = Array.from({ length: groupCount }, (_, index) =>
    getGroupName(index),
  );
  const seededParticipants = [...participants].sort(
    (a, b) => (a.seed ?? 0) - (b.seed ?? 0),
  );

  return seededParticipants.map((participant, index) => {
    const cycleLength = groupCount * 2;
    const cyclePosition = index % cycleLength;
    const groupIndex =
      cyclePosition < groupCount
        ? cyclePosition
        : cycleLength - cyclePosition - 1;

    return {
      ...participant,
      seed: participant.seed ?? index + 1,
      groupName: groupNames[groupIndex],
    };
  });
}

export function generateLeagueKnockoutFixtures(
  participants: TournamentParticipant[],
  matchesPerOpponent: number,
  requestedGroupCount: number,
): { participants: TournamentParticipant[]; fixtures: TournamentFixture[] } {
  const groupedParticipants = assignGroupsToParticipants(
    participants,
    requestedGroupCount,
  );
  const groupNames = Array.from(
    new Set(
      groupedParticipants
        .map((participant) => participant.groupName)
        .filter(Boolean),
    ),
  ) as string[];

  if (groupNames.length === 0) {
    return {
      participants: groupedParticipants,
      fixtures: generateLeagueFixtures(groupedParticipants, matchesPerOpponent),
    };
  }

  const fixtures: TournamentFixture[] = [];
  let roundOffset = 0;

  for (const groupName of groupNames) {
    const groupParticipants = groupedParticipants.filter(
      (participant) => participant.groupName === groupName,
    );
    const groupFixtures = generateLeagueFixtures(
      groupParticipants,
      matchesPerOpponent,
    ).map((fixture) => ({
      ...fixture,
      groupName,
      roundIndex: fixture.roundIndex + roundOffset,
    }));

    fixtures.push(...groupFixtures);
    const maxRoundIndex = groupFixtures.reduce(
      (max, fixture) => Math.max(max, fixture.roundIndex),
      roundOffset - 1,
    );
    roundOffset = maxRoundIndex + 1;
  }

  return {
    participants: groupedParticipants,
    fixtures,
  };
}

/** Unique non-empty league group labels from participants, stable display order. */
export function sortedExplicitLeagueGroupNames(
  participants: TournamentParticipant[],
): string[] {
  return Array.from(
    new Set(
      participants
        .map((p) => p.groupName?.trim())
        .filter((g): g is string => Boolean(g)),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

/**
 * League + knockout with multiple groups: every player has a group assigned.
 * When true, fixture rebuilds keep those assignments and use roster order within each group.
 */
export function tournamentHasExplicitLeagueGroups(tournament: Tournament): boolean {
  if (tournament.type !== "LEAGUE_KNOCKOUT") return false;
  const n = tournament.participants.length;
  if (n < 2) return false;
  const effective = getEffectiveGroupCount(
    n,
    tournament.settings.groupCount ?? 1,
  );
  if (effective <= 1) return false;
  return tournament.participants.every(
    (p) => typeof p.groupName === "string" && p.groupName.trim().length > 0,
  );
}

export function generateLeagueKnockoutFixturesWithExistingGroups(
  participants: TournamentParticipant[],
  matchesPerOpponent: number,
): { participants: TournamentParticipant[]; fixtures: TournamentFixture[] } {
  const groupNames = sortedExplicitLeagueGroupNames(participants);

  if (groupNames.length === 0) {
    const flat = participants.map((p, i) => ({
      ...p,
      seed: i + 1,
      groupName: undefined,
    }));
    return {
      participants: flat,
      fixtures: generateLeagueFixtures(flat, matchesPerOpponent),
    };
  }

  const fixtures: TournamentFixture[] = [];
  let roundOffset = 0;

  for (const groupName of groupNames) {
    const groupParticipants = participants.filter(
      (p) => p.groupName === groupName,
    );
    const groupFixtures = generateLeagueFixtures(
      groupParticipants,
      matchesPerOpponent,
    ).map((fixture) => ({
      ...fixture,
      groupName,
      roundIndex: fixture.roundIndex + roundOffset,
    }));

    fixtures.push(...groupFixtures);
    const maxRoundIndex = groupFixtures.reduce(
      (max, fixture) => Math.max(max, fixture.roundIndex),
      roundOffset - 1,
    );
    roundOffset = maxRoundIndex + 1;
  }

  const withSeeds = participants.map((p, i) => ({ ...p, seed: i + 1 }));
  return { participants: withSeeds, fixtures };
}

function nextPowerOfTwo(value: number): number {
  let power = 1;
  while (power < value) power *= 2;
  return power;
}

export function createKnockoutFixtures(
  orderedParticipantIds: string[],
): TournamentFixture[] {
  if (orderedParticipantIds.length < 2) return [];

  const bracketSize = nextPowerOfTwo(orderedParticipantIds.length);
  const slots: Array<string | undefined> = [
    ...orderedParticipantIds,
    ...Array.from(
      { length: bracketSize - orderedParticipantIds.length },
      () => undefined,
    ),
  ];
  const fixtures: TournamentFixture[] = [];
  const rounds = Math.log2(bracketSize);
  let previousRoundIds: string[] = [];

  for (let round = 0; round < rounds; round++) {
    const fixtureCount = bracketSize / Math.pow(2, round + 1);
    const currentRoundIds: string[] = [];
    const roundName =
      rounds === 1
        ? "Final"
        : round === rounds - 1
          ? "Final"
          : round === rounds - 2
            ? "Semi Final"
            : round === rounds - 3
              ? "Quarter Final"
              : `Round ${round + 1}`;

    for (let index = 0; index < fixtureCount; index++) {
      const fixture: TournamentFixture = {
        id: crypto.randomUUID(),
        stage: "KNOCKOUT",
        roundName,
        roundIndex: round,
        matchIndex: index,
        status: "PENDING",
        allowDraw: false,
        label: `${roundName} ${index + 1}`,
      };

      if (round === 0) {
        fixture.participant1Id = slots[index * 2];
        fixture.participant2Id = slots[index * 2 + 1];
      } else {
        fixture.sourceFixtureIds = [
          previousRoundIds[index * 2],
          previousRoundIds[index * 2 + 1],
        ];
        fixture.sourceOutcomes = ["WINNER", "WINNER"];
      }

      currentRoundIds.push(fixture.id);
      fixtures.push(fixture);
    }

    previousRoundIds = currentRoundIds;
  }

  if (rounds >= 2 && previousRoundIds.length === 1) {
    const semifinalIds = fixtures
      .filter((fixture) => fixture.roundName === "Semi Final")
      .sort((a, b) => a.matchIndex - b.matchIndex)
      .map((fixture) => fixture.id);

    if (semifinalIds.length === 2) {
      fixtures.push({
        id: crypto.randomUUID(),
        stage: "KNOCKOUT",
        roundName: "3rd Place",
        roundIndex: rounds,
        matchIndex: 0,
        sourceFixtureIds: semifinalIds,
        sourceOutcomes: ["LOSER", "LOSER"],
        status: "PENDING",
        allowDraw: false,
        label: "3rd Place Playoff",
      });
    }
  }

  return advanceKnockoutFixtures(fixtures);
}

function getFixtureOutcomeParticipant(
  fixture: TournamentFixture | undefined,
  outcome: "WINNER" | "LOSER",
): string | undefined {
  if (!fixture) return undefined;
  if (outcome === "WINNER") {
    return fixture.winnerId;
  }

  if (!fixture.participant1Id || !fixture.participant2Id || !fixture.winnerId) {
    return undefined;
  }

  return fixture.winnerId === fixture.participant1Id
    ? fixture.participant2Id
    : fixture.participant1Id;
}

export function advanceKnockoutFixtures(
  fixtures: TournamentFixture[],
): TournamentFixture[] {
  const sorted = [...fixtures].sort(
    (a, b) => a.roundIndex - b.roundIndex || a.matchIndex - b.matchIndex,
  );
  const resolved = new Map<string, TournamentFixture>();

  for (const fixture of sorted) {
    let nextFixture: TournamentFixture = { ...fixture };

    if (
      nextFixture.stage === "KNOCKOUT" &&
      nextFixture.sourceFixtureIds?.length
    ) {
      const [sourceA, sourceB] = nextFixture.sourceFixtureIds;
      const sourceFixtureA = sourceA ? resolved.get(sourceA) : undefined;
      const sourceFixtureB = sourceB ? resolved.get(sourceB) : undefined;
      const [outcomeA = "WINNER", outcomeB = "WINNER"] =
        nextFixture.sourceOutcomes ?? ["WINNER", "WINNER"];
      nextFixture = {
        ...nextFixture,
        participant1Id: getFixtureOutcomeParticipant(sourceFixtureA, outcomeA),
        participant2Id: getFixtureOutcomeParticipant(sourceFixtureB, outcomeB),
      };
    }

    if (!nextFixture.matchId) {
      if (nextFixture.participant1Id && nextFixture.participant2Id) {
        nextFixture = {
          ...nextFixture,
          status: "READY",
          winnerId: undefined,
        };
      } else if (nextFixture.participant1Id || nextFixture.participant2Id) {
        nextFixture = {
          ...nextFixture,
          status: "BYE",
          winnerId: nextFixture.participant1Id || nextFixture.participant2Id,
        };
      } else {
        nextFixture = {
          ...nextFixture,
          status: "PENDING",
          winnerId: undefined,
        };
      }
    }

    resolved.set(nextFixture.id, nextFixture);
  }

  return fixtures.map((fixture) => resolved.get(fixture.id) ?? fixture);
}

export function getQualifiedParticipants(
  tournament: Tournament,
): TournamentParticipant[] {
  const qualifierCount = getEffectiveKnockoutQualifierCount(tournament);
  const effectiveGroupCount = getEffectiveGroupCount(
    tournament.participants.length,
    tournament.settings.groupCount ?? 1,
  );

  if (tournament.type === "LEAGUE_KNOCKOUT" && effectiveGroupCount > 1) {
    const groupedStandings = getGroupStandings(tournament);
    const orderedIds: string[] = [];
    const maxDepth = Math.max(
      ...groupedStandings.map((group) => group.players.length),
      0,
    );

    for (let position = 0; position < maxDepth; position++) {
      for (const group of groupedStandings) {
        const player = group.players[position];
        if (player) {
          orderedIds.push(player.id);
        }
      }
    }

    return orderedIds
      .slice(0, qualifierCount)
      .map((id) =>
        tournament.participants.find((participant) => participant.id === id),
      )
      .filter(Boolean) as TournamentParticipant[];
  }

  const standings = getSortedByView(
    deriveTournamentPlayers(tournament, getTournamentTableMatches(tournament)),
    "TABLE",
  );
  return standings
    .slice(0, qualifierCount)
    .map((player) =>
      tournament.participants.find(
        (participant) => participant.id === player.id,
      ),
    )
    .filter(Boolean) as TournamentParticipant[];
}

export function createLeagueKnockoutBracket(
  tournament: Tournament,
  orderedQualifiedIds: string[],
): Tournament {
  const knockoutFixtures = createKnockoutFixtures(orderedQualifiedIds);

  return {
    ...tournament,
    fixtures: [
      ...tournament.fixtures.filter((fixture) => fixture.stage !== "KNOCKOUT"),
      ...knockoutFixtures,
    ],
    updatedAt: Date.now(),
  };
}

function getDescendantFixtureIds(
  fixtures: TournamentFixture[],
  fixtureId: string,
): string[] {
  const directChildren = fixtures
    .filter((fixture) => fixture.sourceFixtureIds?.includes(fixtureId))
    .map((fixture) => fixture.id);

  return directChildren.flatMap((childId) => [
    childId,
    ...getDescendantFixtureIds(fixtures, childId),
  ]);
}

function resetFixtureForReplay(fixture: TournamentFixture): TournamentFixture {
  return {
    ...fixture,
    matchId: undefined,
    winnerId: undefined,
    status: fixture.sourceFixtureIds?.length
      ? "PENDING"
      : fixture.status === "BYE"
        ? "BYE"
        : "READY",
  };
}

export function syncLeagueKnockoutStage(tournament: Tournament): Tournament {
  if (tournament.type !== "LEAGUE_KNOCKOUT") {
    return tournament;
  }

  const leagueComplete = isLeagueComplete(tournament);
  const nonKnockoutFixtures = tournament.fixtures.filter(
    (fixture) => fixture.stage !== "KNOCKOUT",
  );
  const knockoutFixtures = tournament.fixtures.filter(
    (fixture) => fixture.stage === "KNOCKOUT",
  );
  const knockoutMatchesPlayed = tournament.matches.some(
    (match) => match.stage === "KNOCKOUT",
  );

  if (!leagueComplete) {
    if (!knockoutMatchesPlayed && knockoutFixtures.length > 0) {
      return {
        ...tournament,
        fixtures: nonKnockoutFixtures,
        matches: tournament.matches.filter(
          (match) => match.stage !== "KNOCKOUT",
        ),
        updatedAt: Date.now(),
      };
    }
    return tournament;
  }

  const qualifiedIds = getQualifiedParticipants(tournament).map(
    (participant) => participant.id,
  );
  if (qualifiedIds.length < 2) {
    return tournament;
  }

  if (knockoutMatchesPlayed) {
    return tournament;
  }

  const regeneratedKnockout = createKnockoutFixtures(qualifiedIds);
  const existingSerialized = JSON.stringify(
    knockoutFixtures.map((fixture) => ({
      roundName: fixture.roundName,
      participant1Id: fixture.participant1Id,
      participant2Id: fixture.participant2Id,
      sourceFixtureIds: fixture.sourceFixtureIds,
      sourceOutcomes: fixture.sourceOutcomes,
    })),
  );
  const regeneratedSerialized = JSON.stringify(
    regeneratedKnockout.map((fixture) => ({
      roundName: fixture.roundName,
      participant1Id: fixture.participant1Id,
      participant2Id: fixture.participant2Id,
      sourceFixtureIds: fixture.sourceFixtureIds,
      sourceOutcomes: fixture.sourceOutcomes,
    })),
  );

  if (
    existingSerialized === regeneratedSerialized &&
    knockoutFixtures.length > 0
  ) {
    return tournament;
  }

  return {
    ...tournament,
    fixtures: [...nonKnockoutFixtures, ...regeneratedKnockout],
    updatedAt: Date.now(),
  };
}

export function recordFixtureResult(
  tournament: Tournament,
  fixtureId: string,
  score1: number,
  score2: number,
): Tournament {
  const fixture = tournament.fixtures.find((item) => item.id === fixtureId);
  if (!fixture || !fixture.participant1Id || !fixture.participant2Id)
    return tournament;
  if (!fixture.allowDraw && score1 === score2) {
    throw new Error("Knockout matches cannot end in a draw.");
  }

  const winnerId =
    fixture.stage === "KNOCKOUT"
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
          status: "COMPLETED" as const,
          matchId: match.id,
          winnerId,
        }
      : item,
  );

  fixtures = advanceKnockoutFixtures(fixtures);

  return {
    ...tournament,
    matches: [match, ...tournament.matches],
    fixtures,
    updatedAt: Date.now(),
  };
}

export function editFixtureResult(
  tournament: Tournament,
  fixtureId: string,
  score1: number,
  score2: number,
): Tournament {
  const fixture = tournament.fixtures.find((item) => item.id === fixtureId);
  if (!fixture || !fixture.participant1Id || !fixture.participant2Id) {
    return tournament;
  }
  if (!fixture.allowDraw && score1 === score2) {
    throw new Error("Knockout matches cannot end in a draw.");
  }

  const descendantIds =
    fixture.stage === "KNOCKOUT"
      ? getDescendantFixtureIds(tournament.fixtures, fixtureId)
      : [];
  const blockedDescendantIds = descendantIds.filter((descendantId) =>
    tournament.fixtures.some(
      (candidate) => candidate.id === descendantId && candidate.matchId,
    ),
  );
  if (blockedDescendantIds.length > 0) {
    throw new Error(
      "Delete downstream knockout results before editing this match.",
    );
  }

  const existingMatch = tournament.matches.find(
    (match) => match.fixtureId === fixtureId,
  );
  const winnerId =
    fixture.stage === "KNOCKOUT"
      ? score1 > score2
        ? fixture.participant1Id
        : fixture.participant2Id
      : undefined;

  const updatedMatch: Match = existingMatch
    ? {
        ...existingMatch,
        score1,
        score2,
        winnerId,
        timestamp: Date.now(),
      }
    : {
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

  let fixtures = tournament.fixtures.map((item) => {
    if (item.id === fixtureId) {
      return {
        ...item,
        status: "COMPLETED" as const,
        matchId: updatedMatch.id,
        winnerId,
      };
    }
    if (descendantIds.includes(item.id)) {
      return resetFixtureForReplay(item);
    }
    return item;
  });

  fixtures = advanceKnockoutFixtures(fixtures);

  const matches = tournament.matches.map((match) =>
    match.fixtureId === fixtureId ? updatedMatch : match,
  );
  if (!existingMatch) {
    matches.unshift(updatedMatch);
  }

  return {
    ...tournament,
    matches,
    fixtures,
    updatedAt: Date.now(),
  };
}

export function deleteFixtureResult(
  tournament: Tournament,
  fixtureId: string,
): Tournament {
  const fixture = tournament.fixtures.find((item) => item.id === fixtureId);
  if (!fixture?.matchId) {
    return tournament;
  }

  const descendantIds =
    fixture.stage === "KNOCKOUT"
      ? getDescendantFixtureIds(tournament.fixtures, fixtureId)
      : [];
  const blockedDescendantIds = descendantIds.filter((descendantId) =>
    tournament.fixtures.some(
      (candidate) => candidate.id === descendantId && candidate.matchId,
    ),
  );
  if (blockedDescendantIds.length > 0) {
    throw new Error(
      "Delete downstream knockout results before deleting this match.",
    );
  }

  let fixtures = tournament.fixtures.map((item) => {
    if (item.id === fixtureId || descendantIds.includes(item.id)) {
      return resetFixtureForReplay(item);
    }
    return item;
  });

  fixtures = advanceKnockoutFixtures(fixtures);

  return {
    ...tournament,
    matches: tournament.matches.filter(
      (match) => match.fixtureId !== fixtureId,
    ),
    fixtures,
    updatedAt: Date.now(),
  };
}

export function recordOpenMatch(
  tournament: Tournament,
  participant1Id: string,
  participant2Id: string,
  score1: number,
  score2: number,
): Tournament {
  const match: Match = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    tournamentId: tournament.id,
    player1Id: participant1Id,
    player2Id: participant2Id,
    score1,
    score2,
    stage: "OPEN",
  };

  return {
    ...tournament,
    matches: [match, ...tournament.matches],
    updatedAt: Date.now(),
  };
}

export function getReadyFixtures(tournament: Tournament): TournamentFixture[] {
  return tournament.fixtures.filter(
    (fixture) => fixture.status === "READY" && !fixture.matchId,
  );
}

export function isLeagueComplete(tournament: Tournament): boolean {
  const leagueFixtures = tournament.fixtures.filter(
    (fixture) => fixture.stage === "LEAGUE",
  );
  if (leagueFixtures.length === 0) return false;
  return leagueFixtures.every(
    (fixture) => fixture.matchId || fixture.status === "BYE",
  );
}

/** True until the first match result exists for this tournament. */
export function isTournamentBeforeFirstMatch(tournament: Tournament): boolean {
  return tournament.matches.length === 0;
}

export function getTournamentTargetPlayerCount(tournament: Tournament): number {
  const n = tournament.participants.length;
  const target = tournament.targetPlayerCount;
  if (typeof target === "number" && Number.isFinite(target)) {
    return Math.max(2, Math.floor(target));
  }
  return Math.max(2, n);
}

/**
 * Reorder the full squad for schedule generation (league table or knockout bracket).
 * Not used for multi-group league+knockout — use reorderTournamentGroupRosterOrderBeforeFirstMatch per group.
 */
export function reorderTournamentParticipantsBeforeFirstMatch(
  tournament: Tournament,
  orderedParticipantIds: string[],
): Tournament | null {
  if (!isTournamentBeforeFirstMatch(tournament)) return null;
  if (tournament.type === "OPEN_LEAGUE") return null;
  if (tournament.participants.length < 2) return null;
  if (
    tournament.type === "LEAGUE_KNOCKOUT" &&
    tournamentHasExplicitLeagueGroups(tournament)
  ) {
    return null;
  }

  const idSet = new Set(tournament.participants.map((p) => p.id));
  if (orderedParticipantIds.length !== idSet.size) return null;
  if (!orderedParticipantIds.every((id) => idSet.has(id))) return null;

  const map = new Map(tournament.participants.map((p) => [p.id, p]));
  const reordered = orderedParticipantIds.map((id) => map.get(id)!);

  return rebuildTournamentFixturesFromStructure({
    ...tournament,
    participants: reordered,
    updatedAt: Date.now(),
  });
}

/** Reorder players inside one league group; keeps group assignments. Only before the first match. */
/**
 * Flatten participants into canonical group order (Group A, then B, …).
 * Within each group, order follows the first appearance in `baseOrder`.
 */
export function flattenParticipantsByCanonicalLeagueGroups(
  baseOrder: TournamentParticipant[],
  relabeled: TournamentParticipant[],
  canonicalGroupOrder: string[],
): TournamentParticipant[] {
  const byId = new Map(relabeled.map((p) => [p.id, p]));
  const out: TournamentParticipant[] = [];
  for (const gn of canonicalGroupOrder) {
    for (const p of baseOrder) {
      const q = byId.get(p.id);
      if (q && q.groupName === gn) out.push(q);
    }
  }
  return out;
}

/** Allowed league group labels for the current squad size and settings. */
export function canonicalLeagueKnockoutGroupNames(
  participantCount: number,
  requestedGroupCount: number,
): string[] {
  const effective = getEffectiveGroupCount(
    participantCount,
    requestedGroupCount,
  );
  return Array.from({ length: effective }, (_, i) => getGroupName(i));
}

/**
 * Reassign league groups (swap or move players between Group A / B / …) before the first match.
 */
export function assignLeagueKnockoutParticipantGroupsBeforeFirstMatch(
  tournament: Tournament,
  groupByParticipantId: Record<string, string>,
): Tournament | null {
  if (!isTournamentBeforeFirstMatch(tournament)) return null;
  if (tournament.type !== "LEAGUE_KNOCKOUT") return null;

  const n = tournament.participants.length;
  const canonical = canonicalLeagueKnockoutGroupNames(
    n,
    tournament.settings.groupCount ?? 1,
  );
  if (canonical.length <= 1) return null;

  const idSet = new Set(tournament.participants.map((p) => p.id));
  const keys = Object.keys(groupByParticipantId);
  if (keys.length !== idSet.size || !keys.every((k) => idSet.has(k))) {
    return null;
  }

  const allowed = new Set(canonical);
  const nextRelabeled: TournamentParticipant[] = [];
  for (const p of tournament.participants) {
    const raw = groupByParticipantId[p.id];
    const g = typeof raw === "string" ? raw.trim() : "";
    if (!allowed.has(g)) return null;
    nextRelabeled.push({ ...p, groupName: g });
  }

  const merged = flattenParticipantsByCanonicalLeagueGroups(
    tournament.participants,
    nextRelabeled,
    canonical,
  );

  return rebuildTournamentFixturesFromStructure({
    ...tournament,
    participants: merged,
    updatedAt: Date.now(),
  });
}

export function reorderTournamentGroupRosterOrderBeforeFirstMatch(
  tournament: Tournament,
  groupName: string,
  orderedParticipantIds: string[],
): Tournament | null {
  if (!isTournamentBeforeFirstMatch(tournament)) return null;
  if (tournament.type !== "LEAGUE_KNOCKOUT") return null;
  if (!tournamentHasExplicitLeagueGroups(tournament)) return null;

  const gn = groupName.trim();
  const inGroup = tournament.participants.filter((p) => p.groupName === gn);
  const idSet = new Set(inGroup.map((p) => p.id));
  if (orderedParticipantIds.length !== idSet.size) return null;
  if (!orderedParticipantIds.every((id) => idSet.has(id))) return null;

  const map = new Map(tournament.participants.map((p) => [p.id, p]));
  const reorderedGroup = orderedParticipantIds.map((id) => map.get(id)!);

  let inserted = false;
  const merged: TournamentParticipant[] = [];
  for (const p of tournament.participants) {
    if (p.groupName === gn) {
      if (!inserted) {
        merged.push(...reorderedGroup);
        inserted = true;
      }
      continue;
    }
    merged.push(p);
  }

  return rebuildTournamentFixturesFromStructure({
    ...tournament,
    participants: merged,
    updatedAt: Date.now(),
  });
}

/** Randomize participant order and re-seed; use before first match. */
export function shuffleTournamentParticipantOrder(
  participants: TournamentParticipant[],
): TournamentParticipant[] {
  const copy = [...participants];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy.map((participant, index) => ({
    ...participant,
    seed: index + 1,
  }));
}

/**
 * Rebuilds fixtures (and group assignments for league+knockout) from the
 * current type, settings, and participant list. Only safe when no matches
 * have been recorded.
 */
export function rebuildTournamentFixturesFromStructure(
  tournament: Tournament,
  options?: { regroupLeagueKnockout?: boolean },
): Tournament {
  if (tournament.type === "OPEN_LEAGUE") {
    return {
      ...tournament,
      fixtures: [],
      participants: tournament.participants.map((participant) => ({
        ...participant,
        groupName: undefined,
      })),
      updatedAt: Date.now(),
    };
  }

  let participants = tournament.participants.map((participant) => ({
    ...participant,
  }));
  let fixtures: TournamentFixture[] = [];

  if (tournament.type === "LEAGUE") {
    participants = participants.map((participant) => ({
      ...participant,
      groupName: undefined,
    }));
    fixtures = generateLeagueFixtures(
      participants,
      tournament.settings.matchesPerOpponent,
    );
  } else if (tournament.type === "KNOCKOUT") {
    participants = participants.map((participant) => ({
      ...participant,
      groupName: undefined,
    }));
    fixtures = createKnockoutFixtures(participants.map((p) => p.id));
  } else if (tournament.type === "LEAGUE_KNOCKOUT") {
    const tempTournament: Tournament = { ...tournament, participants };
    const useExistingGroups =
      !options?.regroupLeagueKnockout &&
      tournamentHasExplicitLeagueGroups(tempTournament);
    if (useExistingGroups) {
      const setup = generateLeagueKnockoutFixturesWithExistingGroups(
        participants,
        tournament.settings.matchesPerOpponent,
      );
      participants = setup.participants;
      fixtures = setup.fixtures;
    } else {
      const setup = generateLeagueKnockoutFixtures(
        participants,
        tournament.settings.matchesPerOpponent,
        tournament.settings.groupCount,
      );
      participants = setup.participants;
      fixtures = setup.fixtures;
    }
  }

  return {
    ...tournament,
    participants,
    fixtures,
    updatedAt: Date.now(),
  };
}

export function getTournamentProgress(tournament: Tournament): {
  completedMatches: number;
  totalPlannedMatches: number;
  completionPercent: number;
  remainingMatches: number;
  remainingMinutes: number;
} | null {
  if (tournament.type === "OPEN_LEAGUE") return null;

  const leaguePlanned = tournament.fixtures.filter(
    (fixture) => fixture.stage === "LEAGUE",
  ).length;
  const leagueCompleted = tournament.matches.filter(
    (match) => match.stage === "LEAGUE",
  ).length;
  const actualKnockoutPlanned = tournament.fixtures.filter(
    (fixture) => fixture.stage === "KNOCKOUT",
  ).length;
  const projectedKnockoutCount = (() => {
    const baseCount =
      tournament.type === "KNOCKOUT"
        ? Math.max(0, tournament.participants.length - 1)
        : tournament.type === "LEAGUE_KNOCKOUT"
          ? Math.max(0, tournament.settings.qualifierCount - 1)
          : 0;
    const participantCount =
      tournament.type === "KNOCKOUT"
        ? tournament.participants.length
        : tournament.settings.qualifierCount;
    return participantCount >= 4 ? baseCount + 1 : baseCount;
  })();
  const knockoutPlanned =
    actualKnockoutPlanned > 0 ? actualKnockoutPlanned : projectedKnockoutCount;
  const knockoutCompleted = tournament.matches.filter(
    (match) => match.stage === "KNOCKOUT",
  ).length;

  const totalPlannedMatches = leaguePlanned + knockoutPlanned;
  const completedMatches = leagueCompleted + knockoutCompleted;
  const remainingMatches = Math.max(0, totalPlannedMatches - completedMatches);
  const remainingMinutes =
    remainingMatches *
    (tournament.settings.matchDurationMinutes +
      tournament.settings.bufferMinutes);
  const completionPercent =
    totalPlannedMatches > 0
      ? Math.round((completedMatches / totalPlannedMatches) * 100)
      : 0;

  return {
    completedMatches,
    totalPlannedMatches,
    completionPercent,
    remainingMatches,
    remainingMinutes,
  };
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
