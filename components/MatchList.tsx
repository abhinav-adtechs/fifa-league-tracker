import React, { useState, useMemo } from 'react';
import { Match, Player } from '../types';
import { computeHeadToHead } from '../utils/headToHead';
import { Calendar, Filter, Users, X, Swords, TrendingDown, Award, Flame } from 'lucide-react';

interface MatchListProps {
  matches: Match[];
  players: Player[];
}

export const MatchList: React.FC<MatchListProps> = ({ matches, players }) => {
  const [filterP1, setFilterP1] = useState<string>('');
  const [filterP2, setFilterP2] = useState<string>('');

  const getPlayer = (id: string) => players.find(p => p.id === id);

  const filteredMatches = useMemo(() => {
    let m = [...matches].sort((a, b) => b.timestamp - a.timestamp);
    if (filterP1 && filterP2) {
      m = m.filter(match =>
        (match.player1Id === filterP1 && match.player2Id === filterP2) ||
        (match.player1Id === filterP2 && match.player2Id === filterP1)
      );
    } else if (filterP1) {
      m = m.filter(match => match.player1Id === filterP1 || match.player2Id === filterP1);
    }
    return m;
  }, [matches, filterP1, filterP2]);

  const h2h = useMemo(() => {
    if (!filterP1 || !filterP2) return null;
    return computeHeadToHead(filterP1, filterP2, matches);
  }, [matches, filterP1, filterP2]);

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
      {/* Filter Bar */}
      <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 text-text-muted">
          <Filter className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Filters</span>
        </div>
        <div className="flex items-center gap-2 flex-1 sm:flex-initial">
          <select
            value={filterP1}
            onChange={(e) => setFilterP1(e.target.value)}
            className="select-field flex-1 sm:w-40 text-xs sm:text-sm"
          >
            <option value="">Any Player</option>
            {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span className="text-text-muted text-xs font-bold">VS</span>
          <select
            value={filterP2}
            onChange={(e) => setFilterP2(e.target.value)}
            className="select-field flex-1 sm:w-40 text-xs sm:text-sm"
          >
            <option value="">Any Player</option>
            {players.map(p => <option key={p.id} value={p.id} disabled={p.id === filterP1}>{p.name}</option>)}
          </select>
          {(filterP1 || filterP2) && (
            <button
              onClick={() => { setFilterP1(''); setFilterP2(''); }}
              className="p-2 text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors shrink-0"
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

      {/* Head-to-Head comparison (when 2 players selected) */}
      {h2h && filterP1 && filterP2 && (
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
