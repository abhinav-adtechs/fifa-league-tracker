import { Match } from '../types';

export interface MyPerformanceStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  winRate: number; // 0–100
  form: ('W' | 'D' | 'L')[];
  streak: string; // e.g. 'W2' | 'L1' | 'D1'
  biggestWinScore: string | null; // e.g. '5-1' (my score - their score)
  biggestLossScore: string | null;
  biggestWinMargin: number;
  biggestLossMargin: number;
  matchesChronological: Match[];
}

/** Get this player's score and opponent's score in a match (order: me, opponent). */
function getScores(match: Match, playerId: string): { myScore: number; theirScore: number } {
  if (match.player1Id === playerId) {
    return { myScore: match.score1, theirScore: match.score2 };
  }
  return { myScore: match.score2, theirScore: match.score1 };
}

/**
 * Compute full "my performance" stats for a single player from all their matches.
 */
export function computeMyPerformance(playerId: string, matches: Match[]): MyPerformanceStats {
  const myMatches = matches.filter(
    m => m.player1Id === playerId || m.player2Id === playerId
  );
  const matchesChronological = [...myMatches].sort((a, b) => a.timestamp - b.timestamp);

  let wins = 0,
    draws = 0,
    losses = 0;
  let gf = 0,
    ga = 0;
  let biggestWinMargin = 0,
    biggestLossMargin = 0;
  let biggestWinScore: string | null = null,
    biggestLossScore: string | null = null;
  const form: ('W' | 'D' | 'L')[] = [];

  for (const m of matchesChronological) {
    const { myScore, theirScore } = getScores(m, playerId);
    gf += myScore;
    ga += theirScore;

    if (myScore > theirScore) {
      wins++;
      form.push('W');
      const margin = myScore - theirScore;
      if (margin > biggestWinMargin) {
        biggestWinMargin = margin;
        biggestWinScore = `${myScore}-${theirScore}`;
      }
    } else if (myScore < theirScore) {
      losses++;
      form.push('L');
      const margin = theirScore - myScore;
      if (margin > biggestLossMargin) {
        biggestLossMargin = margin;
        biggestLossScore = `${myScore}-${theirScore}`; // my score - their score (e.g. 1-5)
      }
    } else {
      draws++;
      form.push('D');
    }
  }

  const points = wins * 3 + draws;
  const played = matchesChronological.length;
  const winRate = played > 0 ? (wins / played) * 100 : 0;

  // Current streak from most recent match
  let streakCount = 0;
  let streakResult: 'W' | 'L' | 'D' | null = null;
  for (let i = matchesChronological.length - 1; i >= 0; i--) {
    const { myScore, theirScore } = getScores(matchesChronological[i], playerId);
    const result: 'W' | 'L' | 'D' = myScore > theirScore ? 'W' : myScore < theirScore ? 'L' : 'D';
    if (streakResult == null) {
      streakResult = result;
      streakCount = 1;
    } else if (result === streakResult) {
      streakCount++;
    } else {
      break;
    }
  }
  const streak = streakResult ? `${streakResult}${streakCount > 1 ? streakCount : ''}` : '-';

  return {
    played,
    wins,
    draws,
    losses,
    gf,
    ga,
    gd: gf - ga,
    points,
    winRate,
    form,
    streak,
    biggestWinScore,
    biggestLossScore,
    biggestWinMargin,
    biggestLossMargin,
    matchesChronological,
  };
}

/** Day key (start of day in ms, local) for grouping. */
function getDayKey(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export interface DayResult {
  dateKey: number;
  date: string;
  fullLabel: string;
  wins: number;
  draws: number;
  losses: number;
  total: number;
}

/**
 * Build calendar/histogram data: last 30 days, W/D/L counts per day for the player.
 */
export function getCalendarHistogramData(
  playerId: string,
  matches: Match[],
  lastNDays: number = 30
): DayResult[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const myMatches = matches.filter(
    m => m.player1Id === playerId || m.player2Id === playerId
  );

  const out: DayResult[] = [];
  for (let i = lastNDays - 1; i >= 0; i--) {
    const t = now - i * dayMs;
    const key = getDayKey(t);
    const dayMatches = myMatches.filter(m => getDayKey(m.timestamp) === key);

    let wins = 0,
      draws = 0,
      losses = 0;
    for (const m of dayMatches) {
      const { myScore, theirScore } = getScores(m, playerId);
      if (myScore > theirScore) wins++;
      else if (myScore < theirScore) losses++;
      else draws++;
    }

    const d = new Date(t);
    out.push({
      dateKey: key,
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      wins,
      draws,
      losses,
      total: wins + draws + losses,
    });
  }
  return out;
}
