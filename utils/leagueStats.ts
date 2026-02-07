import { Match } from '../types';
import type { LeagueStats } from '../types';

/**
 * Compute league-level stats from matches only.
 * These are aggregate stats for the whole league, not per-player.
 */
export function computeLeagueStats(matches: Match[]): LeagueStats {
  let totalGoals = 0;
  let totalDraws = 0;
  let totalHomeWins = 0;
  let totalAwayWins = 0;

  for (const m of matches) {
    totalGoals += m.score1 + m.score2;
    if (m.score1 === m.score2) {
      totalDraws += 1;
    } else if (m.score1 > m.score2) {
      totalHomeWins += 1;
    } else {
      totalAwayWins += 1;
    }
  }

  const totalMatches = matches.length;
  const avgGoalsPerMatch = totalMatches > 0 ? totalGoals / totalMatches : 0;

  return {
    totalMatches,
    totalGoals,
    avgGoalsPerMatch,
    totalDraws,
    totalHomeWins,
    totalAwayWins,
  };
}
