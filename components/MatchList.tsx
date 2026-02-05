import React, { useState, useMemo } from 'react';
import { Match, Player } from '../types';
import { MessageSquare, Calendar, Filter, Users, X } from 'lucide-react';

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
      // H2H mode
      m = m.filter(match => 
        (match.player1Id === filterP1 && match.player2Id === filterP2) ||
        (match.player1Id === filterP2 && match.player2Id === filterP1)
      );
    } else if (filterP1) {
        // Just one player involved
        m = m.filter(match => match.player1Id === filterP1 || match.player2Id === filterP1);
    }

    return m;
  }, [matches, filterP1, filterP2]);

  if (matches.length === 0) {
    return (
        <div className="text-center py-12 text-fifa-muted bg-fifa-card rounded-xl border border-fifa-surface">
            <p>No matches recorded yet.</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
        
      {/* Filter Section */}
      <div className="bg-fifa-card p-3 sm:p-4 rounded-xl border border-fifa-surface flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-2 text-fifa-accent font-black text-xs sm:text-sm uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Match Filters</span><span className="sm:hidden">Filters</span>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <select 
                value={filterP1}
                onChange={(e) => setFilterP1(e.target.value)}
                className="bg-fifa-dark border border-fifa-surface text-xs sm:text-sm rounded-lg px-2 sm:px-3 py-2 text-white outline-none focus:border-fifa-accent flex-1 md:w-40"
            >
                <option value="">Any Player</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="text-gray-500 self-center font-bold text-xs sm:text-sm">VS</div>
            <select 
                value={filterP2}
                onChange={(e) => setFilterP2(e.target.value)}
                className="bg-fifa-dark border border-fifa-surface text-xs sm:text-sm rounded-lg px-2 sm:px-3 py-2 text-white outline-none focus:border-fifa-accent flex-1 md:w-40"
            >
                <option value="">Any Player</option>
                {players.map(p => <option key={p.id} value={p.id} disabled={p.id === filterP1}>{p.name}</option>)}
            </select>
            {(filterP1 || filterP2) && (
                <button 
                    onClick={() => { setFilterP1(''); setFilterP2(''); }}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
                    title="Clear Filters"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="text-center py-12 bg-fifa-card rounded-xl border border-fifa-surface dashed-border">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">No matches found for this selection.</p>
        </div>
      ) : (
          <div className="grid gap-4">
            {filteredMatches.map((match) => {
                const p1 = getPlayer(match.player1Id);
                const p2 = getPlayer(match.player2Id);
                const p1Won = match.score1 > match.score2;
                const p2Won = match.score2 > match.score1;

                return (
                <div key={match.id} className="bg-fifa-card rounded-xl overflow-hidden border border-fifa-surface card-shadow hover:border-fifa-accent/50 transition-all group">
                    {/* Header */}
                    <div className="bg-fifa-surface/50 px-3 sm:px-4 py-1.5 sm:py-2 flex justify-between items-center text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-white">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            {new Date(match.timestamp).toLocaleDateString()}
                        </div>
                        <div className="hidden sm:block">ID: {match.id.slice(0,4)}</div>
                    </div>

                    <div className="p-3 sm:p-5">
                        <div className="flex items-center justify-between relative">
                            {/* Home Player */}
                            <div className={`flex-1 flex flex-col items-center gap-1.5 sm:gap-2 ${p1Won ? 'opacity-100' : 'opacity-60'}`}>
                                <img 
                                    src={p1?.avatarUrl} 
                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-fifa-surface object-cover" 
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${p1?.name}&backgroundColor=fae100,6b46c1,1a1625`;
                                    }}
                                />
                                <span className="font-black text-white text-center leading-none text-xs sm:text-sm truncate w-full px-1">{p1?.name || 'Unknown'}</span>
                            </div>

                            {/* Score */}
                            <div className="mx-2 sm:mx-4 flex items-center justify-center gap-2 sm:gap-4 z-10">
                                <span className={`text-2xl sm:text-4xl font-black font-mono ${p1Won ? 'text-fifa-accent drop-shadow-[0_0_10px_rgba(250,225,0,0.4)]' : 'text-white'}`}>{match.score1}</span>
                                <div className="h-px w-2 sm:w-4 bg-fifa-surface"></div>
                                <span className={`text-2xl sm:text-4xl font-black font-mono ${p2Won ? 'text-fifa-accent drop-shadow-[0_0_10px_rgba(250,225,0,0.4)]' : 'text-white'}`}>{match.score2}</span>
                            </div>

                            {/* Away Player */}
                            <div className={`flex-1 flex flex-col items-center gap-1.5 sm:gap-2 ${p2Won ? 'opacity-100' : 'opacity-60'}`}>
                                <img 
                                    src={p2?.avatarUrl} 
                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-fifa-surface object-cover" 
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${p2?.name}&backgroundColor=fae100,6b46c1,1a1625`;
                                    }}
                                />
                                <span className="font-black text-white text-center leading-none text-xs sm:text-sm truncate w-full px-1">{p2?.name || 'Unknown'}</span>
                            </div>
                        </div>

                        {match.commentary && (
                          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-fifa-surface/50 flex gap-2 sm:gap-3 items-start">
                              <div className="p-1 sm:p-1.5 bg-gradient-to-br from-fifa-accent to-fifa-green rounded-lg shadow-inner mt-0.5 shrink-0">
                                  <MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" />
                              </div>
                              <p className="text-xs sm:text-sm text-white italic leading-relaxed font-bold">
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
