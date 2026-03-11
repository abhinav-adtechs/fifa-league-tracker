import React, { useState } from 'react';
import { Player, Match } from '../types';
import type { StandingsView } from '../types';
import { getSortedByView, getNormalisedScore, getNormalisedScoreFromStats } from '../utils/standings';
import { computeHeadToHead } from '../utils/headToHead';
import { TrendingUp, ChevronDown, ChevronUp, ArrowRight, Swords, Zap, Users } from 'lucide-react';

interface RankProjectionProps {
  players: Player[];
  matches: Match[];
  view: StandingsView;
}

// ─── Score helpers ────────────────────────────────────────────────────────────

function getScore(p: Player, view: StandingsView): number {
  if (p.played === 0) return 0;
  if (view === 'NORMALISED') return getNormalisedScore(p);
  if (view === 'PPG') return p.points / p.played;
  return p.points;
}

function projectScore(
  played: number,
  points: number,
  gd: number,
  view: StandingsView
): number {
  if (played <= 0) return 0;
  if (view === 'NORMALISED') return getNormalisedScoreFromStats(played, points, gd);
  if (view === 'PPG') return points / played;
  return points;
}

function formatScore(score: number, view: StandingsView): string {
  return view === 'TABLE' ? score.toFixed(0) : score.toFixed(2);
}

function scoreLabel(view: StandingsView): string {
  if (view === 'NORMALISED') return 'Norm';
  if (view === 'PPG') return 'PPG';
  return 'PTS';
}

// ─── Route calculations ───────────────────────────────────────────────────────

/**
 * Route A: wins against anyone (target score stays frozen).
 * Returns minimum consecutive wins needed for current to exceed target's current score.
 */
function winsVsAnyone(
  current: Player,
  frozenTargetScore: number,
  avgGdPerWin: number,
  view: StandingsView
): number | null {
  for (let w = 1; w <= 50; w++) {
    const score = projectScore(
      current.played + w,
      current.points + 3 * w,
      current.gd + w * avgGdPerWin,
      view
    );
    if (score > frozenTargetScore) return w;
  }
  return null;
}

/**
 * Route B: consecutive direct wins against the target.
 * Both scores evolve simultaneously — current gains 3pts + GD, target gains nothing and loses GD.
 * Returns minimum wins where current's new score exceeds target's new score.
 */
function winsVsTarget(
  current: Player,
  target: Player,
  avgGdPerWin: number,
  view: StandingsView
): number | null {
  for (let w = 1; w <= 50; w++) {
    const myScore = projectScore(
      current.played + w,
      current.points + 3 * w,
      current.gd + w * avgGdPerWin,
      view
    );
    const theirScore = projectScore(
      target.played + w,
      target.points,                      // no points from losses
      target.gd - w * avgGdPerWin,        // they concede these goals
      view
    );
    if (myScore > theirScore) return w;
  }
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const RouteRow: React.FC<{
  label: string;
  wins: number | null;
  highlight?: boolean;
}> = ({ label, wins, highlight }) => (
  <div
    className={`flex items-center justify-between rounded-lg px-3 py-2.5 gap-3 ${
      highlight
        ? 'bg-accent-green/8 border border-accent-green/15'
        : 'bg-glass-light'
    }`}
  >
    <span className="text-[11px] text-text-muted flex-1 min-w-0">{label}</span>
    <span
      className={`flex-shrink-0 font-mono font-bold text-sm ${
        highlight ? 'text-accent-green' : 'text-text-secondary'
      }`}
    >
      {wins === null ? (
        <span className="text-[10px] text-text-muted italic font-normal">50+ wins</span>
      ) : wins === 1 ? (
        '1 win'
      ) : (
        `${wins} wins`
      )}
    </span>
  </div>
);

const BeatenBefore: React.FC<{
  current: Player;
  allPlayers: Player[];
  target: Player;
  matches: Match[];
}> = ({ current, allPlayers, target, matches }) => {
  // Build win-rate against every other player (excluding self)
  const opponents = allPlayers.filter(p => p.id !== current.id && p.played > 0);
  if (opponents.length === 0) return null;

  const records = opponents.map(opp => {
    const h2h = computeHeadToHead(current.id, opp.id, matches);
    const total = h2h.winsA + h2h.draws + h2h.winsB;
    return { opp, winsA: h2h.winsA, draws: h2h.draws, winsB: h2h.winsB, total };
  });

  // Only show opponents that have been played against
  const played = records.filter(r => r.total > 0);
  if (played.length === 0) return null;

  // Sort: target first (always shown), then by win rate descending
  const sorted = [...played].sort((a, b) => {
    if (a.opp.id === target.id) return -1;
    if (b.opp.id === target.id) return 1;
    const wrA = a.total > 0 ? a.winsA / a.total : 0;
    const wrB = b.total > 0 ? b.winsA / b.total : 0;
    return wrB - wrA;
  });

  return (
    <div className="space-y-2">
      {sorted.map(({ opp, winsA, draws, winsB, total }) => {
        const isTarget = opp.id === target.id;
        const winPct = total > 0 ? winsA / total : 0;
        return (
          <div
            key={opp.id}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
              isTarget
                ? 'bg-accent-gold/8 border border-accent-gold/15'
                : 'bg-glass-light'
            }`}
          >
            <img
              src={opp.avatarUrl}
              alt={opp.name}
              className="avatar w-6 h-6 flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${opp.name}`;
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold truncate ${isTarget ? 'text-accent-gold' : 'text-text-primary'}`}>
                  {opp.name}
                </span>
                {isTarget && (
                  <span className="text-[9px] font-bold text-accent-gold bg-accent-gold/10 border border-accent-gold/20 rounded px-1 py-0.5 flex-shrink-0 uppercase tracking-wider">
                    Target
                  </span>
                )}
              </div>
              {/* Win-rate bar */}
              <div className="flex items-center gap-1.5 mt-1">
                <div className="flex-1 h-1 rounded-full bg-glass-strong overflow-hidden flex">
                  <div className="h-full bg-accent-green" style={{ width: `${Math.round(winPct * 100)}%` }} />
                  <div className="h-full bg-glass-border" style={{ width: `${Math.round((draws / total) * 100)}%` }} />
                </div>
                <span className="text-[10px] font-mono text-text-muted flex-shrink-0">
                  {winsA}W {draws}D {winsB}L
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Projection Card ──────────────────────────────────────────────────────────

const ProjectionCard: React.FC<{
  current: Player;
  target: Player;
  allPlayers: Player[];
  currentRank: number;
  targetRank: number;
  matches: Match[];
  view: StandingsView;
}> = ({ current, target, allPlayers, currentRank, targetRank, matches, view }) => {
  const [expanded, setExpanded] = useState(false);

  const currentScore = getScore(current, view);
  const targetScore = getScore(target, view);
  const gap = targetScore - currentScore;

  // Route B (direct) — fewest wins needed
  const directTight = winsVsTarget(current, target, 1, view);
  const directDominant = winsVsTarget(current, target, 3, view);
  const bestDirect = directTight ?? directDominant;

  // Route A (anyone) — baseline
  const anyoneTight = winsVsAnyone(current, targetScore, 1, view);
  const anyoneDominant = winsVsAnyone(current, targetScore, 3, view);
  const bestAnyone = anyoneTight ?? anyoneDominant;

  const quickestRoute = bestDirect !== null && (bestAnyone === null || bestDirect <= bestAnyone)
    ? `${bestDirect}W vs ${target.name}`
    : bestAnyone !== null
      ? `${bestAnyone}W vs anyone`
      : null;

  return (
    <div className="glass-card overflow-hidden">
      {/* Collapsed header */}
      <button
        className="w-full text-left p-4 flex items-center gap-3 hover:bg-glass-light/50 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="relative flex-shrink-0">
          <img
            src={current.avatarUrl}
            alt={current.name}
            className="avatar w-9 h-9"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${current.name}`;
            }}
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-glass-strong border border-glass-border flex items-center justify-center">
            <span className="text-[8px] font-bold text-text-muted">#{currentRank}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-sm text-text-primary truncate">{current.name}</span>
            <ArrowRight className="w-3 h-3 text-accent-gold flex-shrink-0" />
            <span className="text-xs text-accent-gold font-semibold">Rank #{targetRank}</span>
            <span className="text-xs text-text-muted hidden sm:inline truncate">({target.name})</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-[11px] text-text-muted">
              Gap:{' '}
              <span className="font-mono font-semibold text-accent-red">
                {formatScore(gap, view)} {scoreLabel(view)}
              </span>
            </span>
            {quickestRoute && (
              <span className="text-[11px] text-accent-green font-semibold">
                · {quickestRoute}
              </span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 text-text-muted">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-5 border-t border-glass-border pt-4">

          {/* Score comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-glass-light rounded-xl p-3 text-center">
              <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Your score</div>
              <div className="text-xl font-extrabold font-mono text-text-primary">
                {formatScore(currentScore, view)}
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">{current.name}</div>
            </div>
            <div className="bg-accent-gold/5 border border-accent-gold/15 rounded-xl p-3 text-center">
              <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Need to beat</div>
              <div className="text-xl font-extrabold font-mono text-accent-gold">
                {formatScore(targetScore, view)}
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">{target.name}</div>
            </div>
          </div>

          {/* Route B: Beat the target directly */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap className="w-3.5 h-3.5 text-accent-green" />
              <span className="text-xs font-bold text-accent-green uppercase tracking-wider">
                Best route — Beat {target.name} directly
              </span>
            </div>
            <p className="text-[10px] text-text-muted leading-relaxed mb-2">
              Every win against {target.name} <span className="text-text-secondary font-medium">moves both scores at once</span> — yours rises, theirs falls. Fewer games needed than beating anyone else.
            </p>
            <div className="space-y-1.5">
              <RouteRow label={`Tight wins vs ${target.name} (avg. +1 GD/game)`} wins={directTight} highlight />
              <RouteRow label={`Dominant wins vs ${target.name} (avg. +3 GD/game)`} wins={directDominant} highlight />
            </div>
          </div>

          {/* Route A: Beat anyone */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Users className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Alternative — Beat anyone
              </span>
            </div>
            <p className="text-[10px] text-text-muted leading-relaxed mb-2">
              Winning against any other player still improves your score, but {target.name}'s score stays unchanged — so you need more wins.
            </p>
            <div className="space-y-1.5">
              <RouteRow label="Tight wins vs anyone (avg. +1 GD/game)" wins={anyoneTight} />
              <RouteRow label="Dominant wins vs anyone (avg. +3 GD/game)" wins={anyoneDominant} />
            </div>
          </div>

          {/* H2H record vs all opponents */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Swords className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Your record vs opponents
              </span>
            </div>
            <BeatenBefore
              current={current}
              allPlayers={allPlayers}
              target={target}
              matches={matches}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────

export const RankProjection: React.FC<RankProjectionProps> = ({ players, matches, view }) => {
  const sorted = getSortedByView(players, view).filter(p => p.played > 0);

  if (sorted.length < 2) return null;

  const challengers = sorted.slice(1);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-accent-green" />
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
          Promotion Path
        </h2>
        <span className="text-[10px] text-text-muted font-mono bg-glass-light border border-glass-border rounded px-1.5 py-0.5">
          {view}
        </span>
      </div>
      <p className="text-[11px] text-text-muted leading-relaxed max-w-2xl">
        What each player needs to overtake the rank above. Beating the target directly is always
        the most efficient route — it moves both scores simultaneously.
      </p>

      <div className="space-y-2">
        {challengers.map((player, i) => (
          <ProjectionCard
            key={player.id}
            current={player}
            target={sorted[i]}
            allPlayers={players}
            currentRank={i + 2}
            targetRank={i + 1}
            matches={matches}
            view={view}
          />
        ))}
      </div>
    </div>
  );
};
