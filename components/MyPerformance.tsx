import React, { useMemo, useState, useEffect } from 'react';
import { Player, Match } from '../types';
import { computeMyPerformance, getCalendarHistogramData } from '../utils/myPerformance';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  User,
  Calendar,
  Target,
  Swords,
  Award,
  TrendingDown,
  Flame,
  BarChart3,
  Goal,
} from 'lucide-react';
import type { Admin } from '../services/auth';

const ACCENT_WIN = '#00E676';
const ACCENT_DRAW = '#55556A';
const ACCENT_LOSS = '#FF5252';

interface MyPerformanceProps {
  players: Player[];
  matches: Match[];
  currentAdmin: Admin | null;
}

export const MyPerformance: React.FC<MyPerformanceProps> = ({
  players,
  matches,
  currentAdmin,
}) => {
  // Default to player whose name matches admin (case-insensitive), else first player
  const defaultPlayerId = useMemo(() => {
    if (currentAdmin?.name) {
      const match = players.find(
        p => p.name.toLowerCase().trim() === currentAdmin.name.toLowerCase().trim()
      );
      if (match) return match.id;
    }
    return players[0]?.id ?? '';
  }, [players, currentAdmin]);

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(defaultPlayerId);

  useEffect(() => {
    if (defaultPlayerId && !selectedPlayerId) setSelectedPlayerId(defaultPlayerId);
  }, [defaultPlayerId]);

  // Keep selection valid if player list changes (e.g. current selection removed)
  useEffect(() => {
    if (selectedPlayerId && !players.some(p => p.id === selectedPlayerId)) {
      setSelectedPlayerId(players[0]?.id ?? '');
    }
  }, [players, selectedPlayerId]);

  const stats = useMemo(
    () => (selectedPlayerId ? computeMyPerformance(selectedPlayerId, matches) : null),
    [selectedPlayerId, matches]
  );

  const calendarData = useMemo(
    () => (selectedPlayerId ? getCalendarHistogramData(selectedPlayerId, matches, 30) : []),
    [selectedPlayerId, matches]
  );

  if (players.length === 0) {
    return (
      <div className="glass-card text-center py-16 px-6">
        <div className="w-14 h-14 rounded-2xl bg-glass-light border border-glass-border mx-auto mb-4 flex items-center justify-center">
          <User className="w-7 h-7 text-text-muted" />
        </div>
        <p className="text-text-secondary font-semibold">No players yet</p>
        <p className="text-sm text-text-muted mt-1">Add players in Squad to view performance.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Player selector */}
      <div className="glass-card p-3 sm:p-4">
        <div className="flex items-center gap-2 text-text-muted mb-3">
          <User className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">My Performance</span>
        </div>
        <p className="text-xs text-text-secondary mb-3">Select your player to see your calendar, consistency, goals, and biggest results.</p>
        <select
          value={selectedPlayerId}
          onChange={e => setSelectedPlayerId(e.target.value)}
          className="select-field w-full max-w-xs text-sm"
        >
          {players.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedPlayerId || !stats ? null : (
        <>
          {/* Calendar / Histogram: Wins & Losses over last 30 days */}
          <div className="glass-card p-3 sm:p-4">
            <div className="flex items-center gap-2 text-text-muted mb-3">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Results in the last 30 days
              </span>
            </div>
            <div className="h-[200px] sm:h-[220px] w-full">
              {calendarData.every(d => d.total === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-text-muted">
                  <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm font-medium">No matches in the last 30 days</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={calendarData}
                    margin={{ top: 6, right: 6, bottom: 4, left: 0 }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis
                      dataKey="date"
                      stroke="rgba(255,255,255,0.1)"
                      tick={{ fontSize: 9, fill: '#55556A', fontFamily: 'JetBrains Mono' }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.04)' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      allowDecimals={false}
                      stroke="rgba(255,255,255,0.1)"
                      tick={{ fontSize: 10, fill: '#55556A', fontFamily: 'JetBrains Mono' }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.04)' }}
                      width={24}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 15, 36, 0.95)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontFamily: 'JetBrains Mono',
                      }}
                      labelFormatter={(_, payload) => payload[0]?.payload?.fullLabel ?? ''}
                      formatter={(value: number, name: string) => {
                        const label =
                          name === 'wins' ? 'Wins' : name === 'losses' ? 'Losses' : 'Draws';
                        return [value, label];
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '10px' }}
                      formatter={value => value}
                      iconType="square"
                      iconSize={8}
                    />
                    <Bar dataKey="wins" name="Wins" stackId="a" fill={ACCENT_WIN} radius={[0, 0, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="draws" name="Draws" stackId="a" fill={ACCENT_DRAW} radius={[0, 0, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="losses" name="Losses" stackId="a" fill={ACCENT_LOSS} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Consistency: Form, Streak, Win rate */}
          <div className="glass-card p-3 sm:p-4">
            <div className="flex items-center gap-2 text-text-muted mb-3">
              <Target className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Consistency
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                  Form (last 5)
                </span>
                <div className="flex gap-1">
                  {(stats.form.slice(-5).length ? stats.form.slice(-5) : ['—']).map((r, i) => (
                    <span
                      key={i}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        r === 'W'
                          ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                          : r === 'L'
                            ? 'bg-accent-red/20 text-accent-red border border-accent-red/30'
                            : 'bg-glass-strong text-text-secondary border border-glass-border'
                      }`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-accent-gold" />
                <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                  Streak
                </span>
                <span className="text-sm font-bold font-mono text-text-primary">{stats.streak}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                  Win rate
                </span>
                <span className="text-sm font-bold font-mono text-accent-green">
                  {stats.played > 0 ? stats.winRate.toFixed(1) : '0'}%
                </span>
              </div>
            </div>
          </div>

          {/* Goals: GF, GA, GD */}
          <div className="grid grid-cols-3 gap-3">
            <div className="stat-card group">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-accent-green/10 border border-accent-green/15 flex items-center justify-center">
                  <Goal className="w-3.5 h-3.5 text-accent-green" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-accent-green font-mono">
                {stats.gf}
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-text-muted uppercase tracking-wider">
                Goals For
              </div>
            </div>
            <div className="stat-card group">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-accent-red/10 border border-accent-red/15 flex items-center justify-center">
                  <Swords className="w-3.5 h-3.5 text-accent-red" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-accent-red font-mono">
                {stats.ga}
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-text-muted uppercase tracking-wider">
                Goals Against
              </div>
            </div>
            <div className="stat-card group">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                    stats.gd >= 0
                      ? 'bg-accent-green/10 border-accent-green/15'
                      : 'bg-accent-red/10 border-accent-red/15'
                  }`}
                >
                  <BarChart3
                    className={`w-3.5 h-3.5 ${stats.gd >= 0 ? 'text-accent-green' : 'text-accent-red'}`}
                  />
                </div>
              </div>
              <div
                className={`text-xl sm:text-2xl font-extrabold font-mono ${
                  stats.gd >= 0 ? 'text-accent-green' : 'text-accent-red'
                }`}
              >
                {stats.gd >= 0 ? '+' : ''}{stats.gd}
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-text-muted uppercase tracking-wider">
                Goal Difference
              </div>
            </div>
          </div>

          {/* Biggest Win & Biggest Loss */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="glass-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent-green/15 border border-accent-green/20 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-accent-green" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                  Biggest Win
                </div>
                <div className="text-lg font-bold text-accent-green font-mono mt-0.5">
                  {stats.biggestWinScore ?? '—'}
                </div>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent-red/15 border border-accent-red/20 flex items-center justify-center shrink-0">
                <TrendingDown className="w-5 h-5 text-accent-red" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                  Biggest Loss
                </div>
                <div className="text-lg font-bold text-accent-red font-mono mt-0.5">
                  {stats.biggestLossScore ?? '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Summary record: W-D-L */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-text-muted mb-2">
              <Swords className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Record</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-text-primary">
                <span className="font-bold text-accent-green">{stats.wins}</span>
                <span className="text-text-muted font-medium ml-1">W</span>
              </span>
              <span className="text-text-muted">·</span>
              <span className="text-text-primary">
                <span className="font-bold text-text-secondary">{stats.draws}</span>
                <span className="text-text-muted font-medium ml-1">D</span>
              </span>
              <span className="text-text-muted">·</span>
              <span className="text-text-primary">
                <span className="font-bold text-accent-red">{stats.losses}</span>
                <span className="text-text-muted font-medium ml-1">L</span>
              </span>
              <span className="text-text-muted text-sm">({stats.played} played)</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
