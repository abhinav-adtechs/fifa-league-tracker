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
        <div className="bg-fifa-card p-1 rounded-lg border border-fifa-surface inline-flex">
          <button
            onClick={() => setMode('ABSOLUTE')}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
              mode === 'ABSOLUTE' 
                ? 'bg-fifa-green text-black shadow-lg' 
                : 'text-fifa-muted hover:text-white'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setMode('NORMALIZED')}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
              mode === 'NORMALIZED' 
                ? 'bg-fifa-accent text-black shadow-lg' 
                : 'text-fifa-muted hover:text-white'
            }`}
          >
            <Calculator className="w-3 h-3" />
            Normalized (PPG)
          </button>
        </div>
      </div>

      <div className="overflow-hidden bg-fifa-card rounded-2xl border border-fifa-surface shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-fifa-dark/50 text-xs uppercase tracking-wider text-fifa-muted border-b border-fifa-surface">
                <th className="p-4 font-bold text-center w-12">#</th>
                <th className="p-4 font-bold">Club</th>
                <th className="p-4 font-bold text-center">MP</th>
                {mode === 'NORMALIZED' && <th className="p-4 font-bold text-center text-fifa-accent">PPG</th>}
                <th className="p-4 font-bold text-center hidden sm:table-cell">W</th>
                <th className="p-4 font-bold text-center hidden sm:table-cell">D</th>
                <th className="p-4 font-bold text-center hidden sm:table-cell">L</th>
                <th className="p-4 font-bold text-center hidden md:table-cell">GD</th>
                {mode === 'ABSOLUTE' && <th className="p-4 font-bold text-center text-fifa-green">PTS</th>}
                <th className="p-4 font-bold text-center hidden lg:table-cell">Form</th>
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
                    <td className="p-4 text-center font-mono text-fifa-muted font-bold relative">
                      {index === 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500"></div>}
                      {index === 1 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-400"></div>}
                      {index === 2 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-700"></div>}
                      {index + 1}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                            src={player.avatarUrl} 
                            alt={player.name} 
                            className="w-10 h-10 rounded-full bg-fifa-surface border border-fifa-surface"
                        />
                        <div>
                            <div className="font-bold text-white text-lg leading-tight group-hover:text-fifa-green transition-colors">
                                {player.name}
                            </div>
                            {index === 0 && <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">League Leader</div>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center font-semibold text-gray-300">{player.played}</td>
                    
                    {mode === 'NORMALIZED' && (
                        <td className="p-4 text-center font-black text-xl text-fifa-accent font-mono">{ppg}</td>
                    )}

                    <td className="p-4 text-center text-gray-400 hidden sm:table-cell">{player.wins}</td>
                    <td className="p-4 text-center text-gray-400 hidden sm:table-cell">{player.draws}</td>
                    <td className="p-4 text-center text-gray-400 hidden sm:table-cell">{player.losses}</td>
                    
                    <td className={`p-4 text-center font-bold hidden md:table-cell ${player.gd > 0 ? 'text-green-400' : player.gd < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                      {player.gd > 0 ? '+' : ''}{player.gd}
                    </td>
                    
                    {mode === 'ABSOLUTE' && (
                        <td className="p-4 text-center font-black text-xl text-fifa-green">{player.points}</td>
                    )}
                    
                    <td className="p-4 hidden lg:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        {player.form.slice(-5).map((result, i) => (
                          <div 
                            key={i} 
                            className={`w-2 h-8 rounded-full 
                              ${result === 'W' ? 'bg-green-500' : 
                                result === 'D' ? 'bg-gray-500' : 
                                'bg-red-500'}`}
                            title={result}
                          />
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
