import type { TournamentType } from "../types";
import { getEffectiveGroupCount } from "./tournaments";

function getLeagueMatchCount(
  playerCount: number,
  matchesPerOpponent: number,
): number {
  if (playerCount < 2) return 0;
  return (playerCount * (playerCount - 1) * matchesPerOpponent) / 2;
}

function getGroupSizes(playerCount: number, groupCount: number): number[] {
  const effectiveGroupCount = getEffectiveGroupCount(playerCount, groupCount);
  const baseSize = Math.floor(playerCount / effectiveGroupCount);
  const remainder = playerCount % effectiveGroupCount;
  return Array.from(
    { length: effectiveGroupCount },
    (_, index) => baseSize + (index < remainder ? 1 : 0),
  );
}

function getGroupedLeagueMatchCount(
  playerCount: number,
  matchesPerOpponent: number,
  groupCount: number,
): number {
  return getGroupSizes(playerCount, groupCount).reduce(
    (sum, size) => sum + getLeagueMatchCount(size, matchesPerOpponent),
    0,
  );
}

function getKnockoutMatchCount(playerCount: number): number {
  if (playerCount < 2) return 0;
  return playerCount - 1;
}

export function buildTournamentPlanSummary({
  type,
  playerCount,
  matchesPerOpponent,
  qualifierCount,
  groupCount,
}: {
  type: TournamentType;
  playerCount: number;
  matchesPerOpponent: number;
  qualifierCount: number;
  groupCount: number;
}) {
  if (type === "OPEN_LEAGUE") {
    return {
      headline: "Open league with no pre-built fixture list",
      breakdown:
        "Players can join the running league and results are recorded whenever matches happen.",
      leagueMatches: 0,
      knockoutMatches: 0,
      totalMatches: 0,
    };
  }

  if (type === "KNOCKOUT") {
    const knockoutMatches = getKnockoutMatchCount(playerCount);
    return {
      headline: "Straight knockout bracket",
      breakdown:
        playerCount < 2
          ? "Add at least 2 players to build the bracket."
          : `${playerCount} players creates ${knockoutMatches} total knockout matches. If the count is not a power of 2, the bracket will include byes.`,
      leagueMatches: 0,
      knockoutMatches,
      totalMatches: knockoutMatches,
    };
  }

  const leagueMatches =
    type === "LEAGUE_KNOCKOUT"
      ? getGroupedLeagueMatchCount(playerCount, matchesPerOpponent, groupCount)
      : getLeagueMatchCount(playerCount, matchesPerOpponent);

  if (type === "LEAGUE") {
    return {
      headline: "Round-robin league",
      breakdown:
        playerCount < 2
          ? "Add at least 2 players to generate league fixtures."
          : `Every player faces every other player ${matchesPerOpponent} time${matchesPerOpponent === 1 ? "" : "s"}, for ${leagueMatches} league games in total.`,
      leagueMatches,
      knockoutMatches: 0,
      totalMatches: leagueMatches,
    };
  }

  const effectiveGroupCount = getEffectiveGroupCount(playerCount, groupCount);
  const effectiveQualifiers = Math.max(
    effectiveGroupCount,
    Math.max(2, Math.min(qualifierCount, playerCount || qualifierCount)),
  );
  const knockoutMatches = getKnockoutMatchCount(effectiveQualifiers);
  const groupSizes = getGroupSizes(playerCount, groupCount).join(" + ");

  return {
    headline: "League stage first, knockout after",
    breakdown:
      playerCount < 2
        ? "Add players to plan the league stage and knockout split."
        : effectiveGroupCount > 1
          ? `${effectiveGroupCount} groups (${groupSizes}) play the league stage first for ${leagueMatches} total group games, then ${effectiveQualifiers} qualifiers move into a ${knockoutMatches}-match knockout bracket.`
          : `${leagueMatches} league matches decide the table, then the top ${effectiveQualifiers} move into a ${knockoutMatches}-match knockout bracket.`,
    leagueMatches,
    knockoutMatches,
    totalMatches: leagueMatches + knockoutMatches,
  };
}
