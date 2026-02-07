import { Player } from '../types';
import type { StandingsView } from '../types';

/**
 * Comprehensive normalised score: rewards consistency over many games and goal difference.
 * - Adjusted PPG = points / (played + 2) — regresses small sample so 2 wins in 2 games
 *   doesn't beat someone with 10 wins in 15 games.
 * - GD per game bonus: up to ±0.1 so dominance in goals is reflected.
 */
export function getNormalisedScore(p: Player): number {
  if (p.played <= 0) return 0;
  const adjustedPpg = p.points / (p.played + 2);
  const gdPerGame = p.gd / p.played;
  const gdBonus = 0.05 * Math.max(-2, Math.min(2, gdPerGame));
  return adjustedPpg + gdBonus;
}

/** Display value for normalised score (2 decimals). */
export function getNormalisedScoreDisplay(p: Player): string {
  return getNormalisedScore(p).toFixed(2);
}

/** Normalised score from cumulative stats (e.g. for trajectory over time). */
export function getNormalisedScoreFromStats(played: number, points: number, gd: number): number {
  if (played <= 0) return 0;
  const adjustedPpg = points / (played + 2);
  const gdPerGame = gd / played;
  const gdBonus = 0.05 * Math.max(-2, Math.min(2, gdPerGame));
  return adjustedPpg + gdBonus;
}

function sortByNormalised(a: Player, b: Player): number {
  const na = getNormalisedScore(a);
  const nb = getNormalisedScore(b);
  if (nb !== na) return nb - na;
  const gdPgA = a.played > 0 ? a.gd / a.played : 0;
  const gdPgB = b.played > 0 ? b.gd / b.played : 0;
  if (gdPgB !== gdPgA) return gdPgB - gdPgA;
  const wrA = a.played > 0 ? a.wins / a.played : 0;
  const wrB = b.played > 0 ? b.wins / b.played : 0;
  return wrB - wrA;
}

function sortByPpg(a: Player, b: Player): number {
  const ppgA = a.played > 0 ? a.points / a.played : 0;
  const ppgB = b.played > 0 ? b.points / b.played : 0;
  if (ppgB !== ppgA) return ppgB - ppgA;
  const wrA = a.played > 0 ? a.wins / a.played : 0;
  const wrB = b.played > 0 ? b.wins / b.played : 0;
  if (wrB !== wrA) return wrB - wrA;
  return b.gd - a.gd;
}

function sortByTable(a: Player, b: Player): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.gd !== a.gd) return b.gd - a.gd;
  return b.gf - a.gf;
}

export function getSortedByView(players: Player[], view: StandingsView): Player[] {
  const copy = [...players];
  if (view === 'NORMALISED') copy.sort(sortByNormalised);
  else if (view === 'PPG') copy.sort(sortByPpg);
  else copy.sort(sortByTable);
  return copy;
}

/** Leader for the given view (must have played at least 1 game). */
export function getLeader(players: Player[], view: StandingsView): Player | undefined {
  const sorted = getSortedByView(players, view);
  return sorted.find(p => p.played > 0) ?? undefined;
}
