import React, { useState, useMemo } from 'react';
import { Match, Player } from '../types';
import { computeHeadToHead } from '../utils/headToHead';
import { Calendar, Filter, Users, X, Swords, TrendingDown, Award, Flame } from 'lucide-react';

interface MatchListProps {
  matches: Match[];
  players: Player[];
}

const DATE_PERIODS = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'month', label: 'This month' },
] as const;

export const MatchList: React.FC<MatchListProps> = ({ matches, players }) => {
  const [h2hPlayerA, setH2hPlayerA] = useState<string>('');
  const [h2hPlayerB, setH2hPlayerB] = useState<string>('');
  const [filterPlayer, setFilterPlayer] = useState<string>('');
  const [filterDatePeriod, setFilterDatePeriod] = useState<string>('all');

  const getPlayer = (id: string) => players.find(p => p.id === id);

  const filteredMatches = useMemo(() => {
    let m = [...matches].sort((a, b) => b.timestamp - a.timestamp);

    if (h2hPlayerA && h2hPlayerB) {
      m = m.filter(match =>
        (match.player1Id === h2hPlayerA && match.player2Id === h2hPlayerB) ||
        (match.player1Id === h2hPlayerB && match.player2Id === h2hPlayerA)
      );
    } else if (filterPlayer) {
      m = m.filter(match => match.player1Id === filterPlayer || match.player2Id === filterPlayer);
    }

    if (filterDatePeriod && filterDatePeriod !== 'all') {
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      let from = 0;
      if (filterDatePeriod === '7d') from = now - 7 * day;
      else if (filterDatePeriod === '30d') from = now - 30 * day;
      else if (filterDatePeriod === 'month') {
        const d = new Date();
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        from = d.getTime();
      }
      m = m.filter(match => match.timestamp >= from);
    }

    return m;
  }, [matches, h2hPlayerA, h2hPlayerB, filterPlayer, filterDatePeriod]);

  const h2h = useMemo(() => {
    if (!h2hPlayerA || !h2hPlayerB) return null;
    return computeHeadToHead(h2hPlayerA, h2hPlayerB, matches);
  }, [matches, h2hPlayerA, h2hPlayerB]);

  if (matches.length === 0) {
    return (
      <div className="glass-card text-center py-16 px-6">
        <div className="w-14 h-14 rounded-2xl bg-glass-light border border-glass-border mx-auto mb-4 flex items-center justify-center">
          <Swords className="w-7 h-7 text-text-muted" />
        </div>
        <p className="text-text-secondary font-semibold">No matches recorded yet</p>
        <p className="text-sm text-text-muted mt-1">Record your first match to see results here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Head to Head Comparison */}
      <div className="glass-card p-3 sm:p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-text-muted">
          <Swords className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Head to Head Comparison</span>
        </div>
        <p className="text-xs text-text-secondary -mt-1">Select two players to compare stats and view matches between them.</p>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={h2hPlayerA}
            onChange={(e) => setH2hPlayerA(e.target.value)}
            className="select-field flex-1 min-w-0 sm:w-40 text-xs sm:text-sm"
          >
            <option value="">Select player</option>
            {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span className="text-text-muted text-xs font-bold">VS</span>
          <select
            value={h2hPlayerB}
            onChange={(e) => setH2hPlayerB(e.target.value)}
            className="select-field flex-1 min-w-0 sm:w-40 text-xs sm:text-sm"
          >
            <option value="">Select player</option>
            {players.map(p => <option key={p.id} value={p.id} disabled={p.id === h2hPlayerA}>{p.name}</option>)}
          </select>
          {(h2hPlayerA || h2hPlayerB) && (
            <button
              onClick={() => { setH2hPlayerA(''); setH2hPlayerB(''); }}
              className="p-2 text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors shrink-0"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filters: date + individual player (only when not in H2H mode) */}
      <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 text-text-muted">
          <Filter className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Filters</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 flex-1 sm:flex-initial">
          <select
            value={filterDatePeriod}
            onChange={(e) => setFilterDatePeriod(e.target.value)}
            className="select-field w-full sm:w-36 text-xs sm:text-sm"
            title="Filter by date range"
          >
            {DATE_PERIODS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {!(h2hPlayerA && h2hPlayerB) && (
            <select
              value={filterPlayer}
              onChange={(e) => setFilterPlayer(e.target.value)}
              className="select-field flex-1 min-w-0 sm:w-40 text-xs sm:text-sm"
              title="Show matches for one player"
            >
              <option value="">Any player</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          {(filterPlayer || filterDatePeriod !== 'all') && (
            <button
              onClick={() => { setFilterPlayer(''); setFilterDatePeriod('all'); }}
              className="p-2 text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors shrink-0"
              aria-label="Clear filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs text-text-muted font-medium">{filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''}</span>
      </div>

      {/* Head-to-Head stats panel (when 2 players selected) */}
      {h2h && h2hPlayerA && h2hPlayerB && (
        <div className="glass-card gradient-border p-4 sm:p-6 animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <Swords className="w-4 h-4 text-accent-green" />
            <span className="text-[11px] font-semibold text-accent-green uppercase tracking-widest">Head to Head</span>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 sm:gap-6 items-start">
            {/* Player A */}
            <div className="flex flex-col items-center text-center">
              <img
                src={getPlayer(h2h.playerAId)?.avatarUrl}
                alt={getPlayer(h2h.playerAId)?.name}
                className="avatar w-14 h-14 sm:w-16 sm:h-16 mb-2"
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  t.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${getPlayer(h2h.playerAId)?.name}`;
                }}
              />
              <span className="font-bold text-text-primary text-sm sm:text-base">{getPlayer(h2h.playerAId)?.name}</span>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-lg sm:text-xl font-extrabold text-accent-green">{h2h.winsA}</span>
                <span className="text-text-muted font-medium">W</span>
                <span className="text-text-muted">·</span>
                <span className="text-lg font-bold text-text-secondary">{h2h.draws}</span>
                <span className="text-text-muted font-medium">D</span>
                <span className="text-text-muted">·</span>
                <span className="text-lg sm:text-xl font-extrabold text-accent-red">{h2h.winsB}</span>
                <span className="text-text-muted font-medium">L</span>
              </div>
              <div className="mt-2 text-xs font-mono text-text-muted">
                GF {h2h.goalsForA} · GA {h2h.goalsAgainstA}
                {h2h.gdA !== 0 && (
                  <span className={h2h.gdA > 0 ? ' text-accent-green ml-1' : ' text-accent-red ml-1'}>
                    (GD {h2h.gdA > 0 ? '+' : ''}{h2h.gdA})
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                <Flame className="w-3 h-3 text-accent-gold" />
                <span className="font-medium text-text-secondary">Streak {h2h.streakA}</span>
              </div>
              {(h2h.biggestWinScoreA || h2h.biggestLossScoreA) && (
                <div className="mt-2 space-y-1 text-[10px] text-text-muted">
                  {h2h.biggestWinScoreA && (
                    <div className="flex items-center gap-1 justify-center">
                      <Award className="w-2.5 h-2.5 text-accent-green" />
                      <span>Best win {h2h.biggestWinScoreA}</span>
                    </div>
                  )}
                  {h2h.biggestLossScoreA && (
                    <div className="flex items-center gap-1 justify-center">
                      <TrendingDown className="w-2.5 h-2.5 text-accent-red" />
                      <span>Worst loss {h2h.biggestLossScoreA}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* VS divider */}
            <div className="flex flex-col items-center justify-center pt-8 sm:pt-10">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">VS</span>
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-text-primary mt-1">
                {h2h.matches.length}
              </span>
              <span className="text-[10px] text-text-muted">matches</span>
            </div>

            {/* Player B */}
            <div className="flex flex-col items-center text-center">
              <img
                src={getPlayer(h2h.playerBId)?.avatarUrl}
                alt={getPlayer(h2h.playerBId)?.name}
                className="avatar w-14 h-14 sm:w-16 sm:h-16 mb-2"
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  t.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${getPlayer(h2h.playerBId)?.name}`;
                }}
              />
              <span className="font-bold text-text-primary text-sm sm:text-base">{getPlayer(h2h.playerBId)?.name}</span>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-lg sm:text-xl font-extrabold text-accent-green">{h2h.winsB}</span>
                <span className="text-text-muted font-medium">W</span>
                <span className="text-text-muted">·</span>
                <span className="text-lg font-bold text-text-secondary">{h2h.draws}</span>
                <span className="text-text-muted font-medium">D</span>
                <span className="text-text-muted">·</span>
                <span className="text-lg sm:text-xl font-extrabold text-accent-red">{h2h.winsA}</span>
                <span className="text-text-muted font-medium">L</span>
              </div>
              <div className="mt-2 text-xs font-mono text-text-muted">
                GF {h2h.goalsForB} · GA {h2h.goalsAgainstB}
                {h2h.gdB !== 0 && (
                  <span className={h2h.gdB > 0 ? ' text-accent-green ml-1' : ' text-accent-red ml-1'}>
                    (GD {h2h.gdB > 0 ? '+' : ''}{h2h.gdB})
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                <Flame className="w-3 h-3 text-accent-gold" />
                <span className="font-medium text-text-secondary">Streak {h2h.streakB}</span>
              </div>
              {(h2h.biggestWinScoreB || h2h.biggestLossScoreB) && (
                <div className="mt-2 space-y-1 text-[10px] text-text-muted">
                  {h2h.biggestWinScoreB && (
                    <div className="flex items-center gap-1 justify-center">
                      <Award className="w-2.5 h-2.5 text-accent-green" />
                      <span>Best win {h2h.biggestWinScoreB}</span>
                    </div>
                  )}
                  {h2h.biggestLossScoreB && (
                    <div className="flex items-center gap-1 justify-center">
                      <TrendingDown className="w-2.5 h-2.5 text-accent-red" />
                      <span>Worst loss {h2h.biggestLossScoreB}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {filteredMatches.length === 0 ? (
        <div className="glass-card text-center py-14">
          <Users className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary font-medium">No matches found for this selection</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredMatches.map((match, index) => {
            const p1 = getPlayer(match.player1Id);
            const p2 = getPlayer(match.player2Id);
            const p1Won = match.score1 > match.score2;
            const p2Won = match.score2 > match.score1;
            const isDraw = match.score1 === match.score2;

            return (
              <div
                key={match.id}
                className="match-card"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                {/* Match Header */}
                <div className="px-4 py-2 border-b border-glass-border flex items-center justify-between">
                  <div className="flex items-center gap-2 text-text-muted">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[11px] font-medium">
                      {new Date(match.timestamp).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">#{match.id.slice(0, 6)}</span>
                </div>

                {/* Match Body */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    {/* Player 1 */}
                    <div className={`flex-1 flex flex-col items-center gap-2 transition-opacity ${p1Won ? 'opacity-100' : isDraw ? 'opacity-80' : 'opacity-50'}`}>
                      <div className="relative">
                        <img
                          src={p1?.avatarUrl}
                          alt={p1?.name}
                          className="avatar w-11 h-11 sm:w-14 sm:h-14"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${p1?.name}`;
                          }}
                        />
                        {p1Won && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-green/20 border border-accent-green/30 flex items-center justify-center">
                            <span className="text-[8px] font-bold text-accent-green">W</span>
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-text-primary text-xs sm:text-sm truncate w-full text-center px-1">
                        {p1?.name || 'Unknown'}
                      </span>
                    </div>

                    {/* Score */}
                    <div className="mx-3 sm:mx-6 flex items-center gap-3 sm:gap-5">
                      <span className={`text-2xl sm:text-4xl font-extrabold font-mono tracking-tight ${
                        p1Won ? 'text-accent-green' : 'text-text-primary'
                      }`}>
                        {match.score1}
                      </span>
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="w-1 h-1 rounded-full bg-text-muted"></div>
                        <div className="w-1 h-1 rounded-full bg-text-muted"></div>
                      </div>
                      <span className={`text-2xl sm:text-4xl font-extrabold font-mono tracking-tight ${
                        p2Won ? 'text-accent-green' : 'text-text-primary'
                      }`}>
                        {match.score2}
                      </span>
                    </div>

                    {/* Player 2 */}
                    <div className={`flex-1 flex flex-col items-center gap-2 transition-opacity ${p2Won ? 'opacity-100' : isDraw ? 'opacity-80' : 'opacity-50'}`}>
                      <div className="relative">
                        <img
                          src={p2?.avatarUrl}
                          alt={p2?.name}
                          className="avatar w-11 h-11 sm:w-14 sm:h-14"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${p2?.name}`;
                          }}
                        />
                        {p2Won && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-green/20 border border-accent-green/30 flex items-center justify-center">
                            <span className="text-[8px] font-bold text-accent-green">W</span>
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-text-primary text-xs sm:text-sm truncate w-full text-center px-1">
                        {p2?.name || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  {/* Commentary */}
                  {match.commentary && (
                    <div className="mt-4 pt-4 border-t border-glass-border">
                      <p className="text-xs sm:text-sm text-text-secondary italic leading-relaxed font-medium">
                        "{match.commentary}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
