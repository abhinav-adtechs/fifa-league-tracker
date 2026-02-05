import React, { useState } from 'react';
import { Player, LeagueMode } from '../types';
import { Trophy, ArrowDown, ArrowUp, Minus, Calculator } from 'lucide-react';

interface StandingsProps {
  players: Player[];
}

export const Standings: React.FC<StandingsProps> = ({ players }) => {
  const [mode, setMode] = useState<LeagueMode>('ABSOLUTE');

  const sortedPlayers = [...players].sort((a, b) => {
    if (mode === 'ABSOLUTE') {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    } else {
      // Normalized: Points Per Game -> Win Rate -> GD
      const ppgA = a.played > 0 ? a.points / a.played : 0;
      const ppgB = b.played > 0 ? b.points / b.played : 0;
      if (ppgB !== ppgA) return ppgB - ppgA;
      
      const winRateA = a.played > 0 ? a.wins / a.played : 0;
      const winRateB = b.played > 0 ? b.wins / b.played : 0;
      if (winRateB !== winRateA) return winRateB - winRateA;
      
      return b.gd - a.gd;
    }
  });

  if (players.length === 0) {
    return (
      <div className="text-center py-20 bg-fifa-card rounded-2xl border border-fifa-surface">
        <Trophy className="w-16 h-16 text-fifa-surface mx-auto mb-4" />
        <p className="text-fifa-muted text-lg">League not started.</p>
        <p className="text-sm text-fifa-muted">Add players to begin the season.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex justify-end">
        <div className="bg-fifa-card p-1 rounded-lg border border-fifa-surface inline-flex flex-wrap gap-1">
          <button
            onClick={() => setMode('ABSOLUTE')}
            className={`px-2 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-black transition-all ${
              mode === 'ABSOLUTE' 
                ? 'bg-fifa-green text-white shadow-lg' 
                : 'text-white hover:text-fifa-accent'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setMode('NORMALIZED')}
            className={`px-2 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-black transition-all flex items-center gap-1 sm:gap-2 ${
              mode === 'NORMALIZED' 
                ? 'bg-fifa-accent text-black shadow-lg' 
                : 'text-white hover:text-fifa-accent'
            }`}
          >
            <Calculator className="w-3 h-3" />
            <span className="hidden sm:inline">Normalized (PPG)</span>
            <span className="sm:hidden">PPG</span>
          </button>
        </div>
      </div>

      <div className="overflow-hidden bg-fifa-card rounded-2xl border border-fifa-surface card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-fifa-dark/50 text-xs uppercase tracking-wider text-white border-b border-fifa-surface">
                <th className="p-2 sm:p-4 font-black text-center w-8 sm:w-12">#</th>
                <th className="p-2 sm:p-4 font-black min-w-[120px]">Club</th>
                <th className="p-2 sm:p-4 font-black text-center">MP</th>
                {mode === 'NORMALIZED' && <th className="p-2 sm:p-4 font-black text-center text-fifa-accent">PPG</th>}
                <th className="p-2 sm:p-4 font-black text-center hidden sm:table-cell">W</th>
                <th className="p-2 sm:p-4 font-black text-center hidden sm:table-cell">D</th>
                <th className="p-2 sm:p-4 font-black text-center hidden sm:table-cell">L</th>
                <th className="p-2 sm:p-4 font-black text-center hidden md:table-cell">GD</th>
                {mode === 'ABSOLUTE' && <th className="p-2 sm:p-4 font-black text-center text-fifa-accent">PTS</th>}
                <th className="p-2 sm:p-4 font-black text-center">Form</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fifa-surface/50">
              {sortedPlayers.map((player, index) => {
                 const ppg = player.played > 0 ? (player.points / player.played).toFixed(2) : "0.00";
                 
                 return (
                  <tr 
                    key={player.id} 
                    className={`hover:bg-white/5 transition-colors group`}
                  >
                    <td className="p-2 sm:p-4 text-center font-mono text-white font-black relative">
                      {index === 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-fifa-accent"></div>}
                      {index === 1 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-400"></div>}
                      {index === 2 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-700"></div>}
                      {index + 1}
                    </td>
                    <td className="p-2 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <img 
                            src={player.avatarUrl} 
                            alt={player.name} 
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-fifa-surface border border-fifa-surface object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}&backgroundColor=fae100,6b46c1,1a1625`;
                            }}
                        />
                        <div className="min-w-0">
                            <div className="font-black text-white text-sm sm:text-lg leading-tight group-hover:text-fifa-accent transition-colors truncate">
                                {player.name}
                            </div>
                            {index === 0 && <div className="text-[8px] sm:text-[10px] font-black text-fifa-accent uppercase tracking-widest">Leader</div>}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 sm:p-4 text-center font-black text-white text-sm sm:text-base">{player.played}</td>
                    
                    {mode === 'NORMALIZED' && (
                        <td className="p-2 sm:p-4 text-center font-black text-lg sm:text-xl text-fifa-accent font-mono">{ppg}</td>
                    )}

                    <td className="p-2 sm:p-4 text-center font-black text-white hidden sm:table-cell text-sm sm:text-base">{player.wins}</td>
                    <td className="p-2 sm:p-4 text-center font-black text-white hidden sm:table-cell text-sm sm:text-base">{player.draws}</td>
                    <td className="p-2 sm:p-4 text-center font-black text-white hidden sm:table-cell text-sm sm:text-base">{player.losses}</td>
                    
                    <td className={`p-2 sm:p-4 text-center font-black hidden md:table-cell text-sm sm:text-base ${player.gd > 0 ? 'text-green-400' : player.gd < 0 ? 'text-red-400' : 'text-white'}`}>
                      {player.gd > 0 ? '+' : ''}{player.gd}
                    </td>
                    
                    {mode === 'ABSOLUTE' && (
                        <td className="p-2 sm:p-4 text-center font-black text-lg sm:text-xl text-fifa-accent">{player.points}</td>
                    )}
                    
                    <td className="p-2 sm:p-4">
                      <div className="flex items-center justify-center gap-1">
                        {player.form.slice(-5).map((result, i) => (
                          <div 
                            key={i} 
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center font-black text-xs sm:text-sm
                              ${result === 'W' ? 'bg-green-500 text-white' : 
                                result === 'D' ? 'bg-gray-500 text-white' : 
                                'bg-red-500 text-white'}`}
                            title={result}
                          >
                            {result}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
