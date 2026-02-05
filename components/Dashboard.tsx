import React from 'react';
import { Player, Match } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Activity, Award } from 'lucide-react';

interface DashboardProps {
  players: Player[];
  matches: Match[];
}

export const Dashboard: React.FC<DashboardProps> = ({ players, matches }) => {
  // Color palette for lines
  const colors = ['#32e0c4', '#3b82f6', '#ec4899', '#f59e0b', '#8b5cf6', '#ef4444'];

  // Prepare Data for "Points Over Time"
  // We need an array of { matchIndex: 1, [player1]: pts, [player2]: pts }
  
  const sortedMatches = [...matches].sort((a, b) => a.timestamp - b.timestamp);
  
  const pointsHistory: any[] = [];
  const currentPoints: Record<string, number> = {};
  
  // Initialize 0 points
  players.forEach(p => currentPoints[p.name] = 0);
  pointsHistory.push({ match: 'Start', ...currentPoints });

  sortedMatches.forEach((m, idx) => {
    const p1 = players.find(p => p.id === m.player1Id);
    const p2 = players.find(p => p.id === m.player2Id);
    
    if (p1 && p2) {
        const p1Pts = m.score1 > m.score2 ? 3 : m.score1 === m.score2 ? 1 : 0;
        const p2Pts = m.score2 > m.score1 ? 3 : m.score2 === m.score1 ? 1 : 0;
        
        currentPoints[p1.name] = (currentPoints[p1.name] || 0) + p1Pts;
        currentPoints[p2.name] = (currentPoints[p2.name] || 0) + p2Pts;
        
        // Snapshot every match
        pointsHistory.push({
            match: idx + 1,
            ...currentPoints
        });
    }
  });

  // Calculate Total Goals
  const totalGoals = matches.reduce((acc, m) => acc + m.score1 + m.score2, 0);
  const avgGoals = matches.length ? (totalGoals / matches.length).toFixed(1) : '0';
  const totalGames = matches.length;
  
  // Top Scorer (GF)
  const topScorer = [...players].sort((a,b) => b.gf - a.gf)[0];

  return (
    <div className="space-y-6">
        
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-fifa-card p-4 rounded-xl border border-fifa-surface">
            <div className="flex items-center gap-2 text-gray-400 text-xs uppercase font-bold mb-1">
                <Activity className="w-4 h-4 text-fifa-green" /> Total Matches
            </div>
            <div className="text-3xl font-black text-white">{totalGames}</div>
        </div>
        <div className="bg-fifa-card p-4 rounded-xl border border-fifa-surface">
            <div className="flex items-center gap-2 text-gray-400 text-xs uppercase font-bold mb-1">
                <TrendingUp className="w-4 h-4 text-fifa-accent" /> Avg Goals/Match
            </div>
            <div className="text-3xl font-black text-white">{avgGoals}</div>
        </div>
        <div className="bg-fifa-card p-4 rounded-xl border border-fifa-surface">
            <div className="flex items-center gap-2 text-gray-400 text-xs uppercase font-bold mb-1">
                <Award className="w-4 h-4 text-yellow-500" /> Golden Boot
            </div>
            <div className="truncate font-bold text-white">{topScorer?.name || '-'}</div>
            <div className="text-xs text-gray-500">{topScorer?.gf || 0} Goals</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-fifa-card p-6 rounded-2xl border border-fifa-surface shadow-xl">
        <h3 className="text-lg font-bold text-white mb-6">Season Trajectory (Points)</h3>
        <div className="h-[300px] w-full">
            {matches.length < 2 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                    Not enough data to display trends. Play more matches!
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pointsHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="match" stroke="#94a3b8" tick={{fontSize: 12}} />
                        <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Legend />
                        {players.map((p, i) => (
                            <Line 
                                key={p.id} 
                                type="monotone" 
                                dataKey={p.name} 
                                stroke={colors[i % colors.length]} 
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
      </div>
    </div>
  );
};
