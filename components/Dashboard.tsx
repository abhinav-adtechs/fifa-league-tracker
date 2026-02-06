import React from 'react';
import { Player, Match } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Activity, Award, Target, BarChart3 } from 'lucide-react';

interface DashboardProps {
  players: Player[];
  matches: Match[];
}

export const Dashboard: React.FC<DashboardProps> = ({ players, matches }) => {
  const colors = ['#00E676', '#448AFF', '#FF6E40', '#FFD740', '#7C4DFF', '#FF5252'];

  const sortedMatches = [...matches].sort((a, b) => a.timestamp - b.timestamp);

  const pointsHistory: any[] = [];
  const currentPoints: Record<string, number> = {};
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
      pointsHistory.push({ match: idx + 1, ...currentPoints });
    }
  });

  const totalGoals = matches.reduce((acc, m) => acc + m.score1 + m.score2, 0);
  const avgGoals = matches.length ? (totalGoals / matches.length).toFixed(1) : '0';
  const totalGames = matches.length;
  const topScorer = [...players].sort((a, b) => b.gf - a.gf)[0];
  const bestDefender = [...players].sort((a, b) => {
    const gaPerGameA = a.played > 0 ? a.ga / a.played : Infinity;
    const gaPerGameB = b.played > 0 ? b.ga / b.played : Infinity;
    return gaPerGameA - gaPerGameB;
  })[0];

  const stats = [
    {
      label: 'Total Matches',
      value: totalGames,
      icon: Activity,
      color: 'text-accent-green',
      bgColor: 'bg-accent-green/10',
      borderColor: 'border-accent-green/15',
    },
    {
      label: 'Avg Goals / Match',
      value: avgGoals,
      icon: TrendingUp,
      color: 'text-accent-gold',
      bgColor: 'bg-accent-gold/10',
      borderColor: 'border-accent-gold/15',
    },
    {
      label: 'Golden Boot',
      value: topScorer?.name || '—',
      subtitle: topScorer ? `${topScorer.gf} Goals` : undefined,
      icon: Award,
      color: 'text-accent-orange',
      bgColor: 'bg-accent-orange/10',
      borderColor: 'border-accent-orange/15',
    },
    {
      label: 'Best Defense',
      value: bestDefender?.name || '—',
      subtitle: bestDefender && bestDefender.played > 0 ? `${(bestDefender.ga / bestDefender.played).toFixed(1)} GA/G` : undefined,
      icon: Target,
      color: 'text-accent-blue',
      bgColor: 'bg-accent-blue/10',
      borderColor: 'border-accent-blue/15',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card group">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-7 h-7 rounded-lg ${stat.bgColor} border ${stat.borderColor} flex items-center justify-center`}>
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              </div>
            </div>
            <div className={`text-xl sm:text-2xl font-extrabold ${stat.color} font-mono tracking-tight truncate`}>
              {stat.value}
            </div>
            {stat.subtitle && (
              <div className="text-[10px] font-medium text-text-muted mt-0.5">{stat.subtitle}</div>
            )}
            <div className="text-[10px] sm:text-[11px] font-medium text-text-muted mt-1 uppercase tracking-wider">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-card p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-4 h-4 text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary">Season Trajectory</h3>
          <span className="text-[10px] font-mono text-text-muted ml-auto">Points over time</span>
        </div>
        <div className="h-[260px] sm:h-[320px] w-full">
          {matches.length < 2 ? (
            <div className="h-full flex flex-col items-center justify-center text-text-muted">
              <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm font-medium">Not enough data yet</p>
              <p className="text-xs mt-1">Play more matches to see trends.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pointsHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="match"
                  stroke="rgba(255,255,255,0.1)"
                  tick={{ fontSize: 11, fill: '#55556A', fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.04)' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.1)"
                  tick={{ fontSize: 11, fill: '#55556A', fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.04)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 15, 36, 0.95)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 20px 40px -12px rgba(0,0,0,0.5)',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono',
                  }}
                  itemStyle={{ color: '#EAEAF0', fontSize: '11px' }}
                  labelStyle={{ color: '#55556A', fontSize: '10px', fontWeight: 600 }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', fontFamily: 'Inter' }}
                  iconType="circle"
                  iconSize={8}
                />
                {players.map((p, i) => (
                  <Line
                    key={p.id}
                    type="monotone"
                    dataKey={p.name}
                    stroke={colors[i % colors.length]}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{
                      r: 5,
                      stroke: colors[i % colors.length],
                      strokeWidth: 2,
                      fill: '#050510',
                    }}
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
