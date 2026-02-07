import { Match } from '../types';

export interface HeadToHeadStats {
  playerAId: string;
  playerBId: string;
  matches: Match[];
  /** Chronological (oldest first) for streak calculation */
  matchesChronological: Match[];
  winsA: number;
  winsB: number;
  draws: number;
  goalsForA: number;
  goalsAgainstA: number;
  goalsForB: number;
  goalsAgainstB: number;
  gdA: number;
  gdB: number;
  /** Current streak from most recent match: e.g. 'W2' | 'L1' | 'D1' */
  streakA: string;
  streakB: string;
  /** Biggest win margin (e.g. 4 for 5-1). 0 if no win. */
  biggestWinMarginA: number;
  biggestWinMarginB: number;
  /** Biggest loss margin. 0 if no loss. */
  biggestLossMarginA: number;
  biggestLossMarginB: number;
  /** Example: "5-1" for A's biggest win (A-B score). */
  biggestWinScoreA: string | null;
  biggestWinScoreB: string | null;
  biggestLossScoreA: string | null;
  biggestLossScoreB: string | null;
}

function getScores(match: Match, playerAId: string): { scoreA: number; scoreB: number } {
  if (match.player1Id === playerAId) {
    return { scoreA: match.score1, scoreB: match.score2 };
  }
  return { scoreA: match.score2, scoreB: match.score1 };
}

export function computeHeadToHead(
  playerAId: string,
  playerBId: string,
  matches: Match[]
): HeadToHeadStats {
  const between = matches.filter(
    m =>
      (m.player1Id === playerAId && m.player2Id === playerBId) ||
      (m.player1Id === playerBId && m.player2Id === playerAId)
  );
  const matchesChronological = [...between].sort((a, b) => a.timestamp - b.timestamp);

  let winsA = 0,
    winsB = 0,
    draws = 0;
  let goalsForA = 0,
    goalsAgainstA = 0,
    goalsForB = 0,
    goalsAgainstB = 0;
  let biggestWinMarginA = 0,
    biggestWinMarginB = 0;
  let biggestLossMarginA = 0,
    biggestLossMarginB = 0;
  let biggestWinScoreA: string | null = null,
    biggestWinScoreB: string | null = null;
  let biggestLossScoreA: string | null = null,
    biggestLossScoreB: string | null = null;

  for (const match of between) {
    const { scoreA, scoreB } = getScores(match, playerAId);
    goalsForA += scoreA;
    goalsAgainstA += scoreB;
    goalsForB += scoreB;
    goalsAgainstB += scoreA;

    if (scoreA > scoreB) {
      winsA++;
      winsB; // no change
      const margin = scoreA - scoreB;
      if (margin > biggestWinMarginA) {
        biggestWinMarginA = margin;
        biggestWinScoreA = `${scoreA}-${scoreB}`;
      }
      const lossMargin = margin;
      if (lossMargin > biggestLossMarginB) {
        biggestLossMarginB = lossMargin;
        biggestLossScoreB = `${scoreB}-${scoreA}`;
      }
    } else if (scoreB > scoreA) {
      winsB++;
      const margin = scoreB - scoreA;
      if (margin > biggestWinMarginB) {
        biggestWinMarginB = margin;
        biggestWinScoreB = `${scoreB}-${scoreA}`;
      }
      if (margin > biggestLossMarginA) {
        biggestLossMarginA = margin;
        biggestLossScoreA = `${scoreA}-${scoreB}`;
      }
    } else {
      draws++;
    }
  }

  const gdA = goalsForA - goalsAgainstA;
  const gdB = goalsForB - goalsAgainstB;

  // Current streak from most recent match (going backwards)
  let streakACount = 0;
  let streakAResult: 'W' | 'L' | 'D' | null = null;
  let streakBCount = 0;
  let streakBResult: 'W' | 'L' | 'D' | null = null;
  for (let i = matchesChronological.length - 1; i >= 0; i--) {
    const { scoreA, scoreB } = getScores(matchesChronological[i], playerAId);
    const resultA = scoreA > scoreB ? 'W' : scoreA < scoreB ? 'L' : 'D';
    const resultB = scoreB > scoreA ? 'W' : scoreB < scoreA ? 'L' : 'D';
    if (streakAResult == null) {
      streakAResult = resultA;
      streakACount = 1;
    } else if (resultA === streakAResult) {
      streakACount++;
    } else {
      break;
    }
  }
  for (let i = matchesChronological.length - 1; i >= 0; i--) {
    const { scoreA, scoreB } = getScores(matchesChronological[i], playerAId);
    const resultB = scoreB > scoreA ? 'W' : scoreB < scoreA ? 'L' : 'D';
    if (streakBResult == null) {
      streakBResult = resultB;
      streakBCount = 1;
    } else if (resultB === streakBResult) {
      streakBCount++;
    } else {
      break;
    }
  }
  const streakALabel = streakAResult ? `${streakAResult}${streakACount > 1 ? streakACount : ''}` : '-';
  const streakBLabel = streakBResult ? `${streakBResult}${streakBCount > 1 ? streakBCount : ''}` : '-';

  return {
    playerAId,
    playerBId,
    matches: between,
    matchesChronological,
    winsA,
    winsB,
    draws,
    goalsForA,
    goalsAgainstA,
    goalsForB,
    goalsAgainstB,
    gdA,
    gdB,
    streakA: streakALabel,
    streakB: streakBLabel,
    biggestWinMarginA,
    biggestWinMarginB,
    biggestLossMarginA,
    biggestLossMarginB,
    biggestWinScoreA,
    biggestWinScoreB,
    biggestLossScoreA,
    biggestLossScoreB,
  };
}
