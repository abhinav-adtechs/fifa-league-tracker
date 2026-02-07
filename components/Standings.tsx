import React from 'react';
import { Player } from '../types';
import type { StandingsView } from '../types';
import { getSortedByView, getNormalisedScoreDisplay } from '../utils/standings';
import { Trophy, Calculator, Crown, Medal, Award, LayoutList } from 'lucide-react';

interface StandingsProps {
  players: Player[];
  /** Current standings view (controlled from parent for hero sync). */
  view?: StandingsView;
  /** Called when user switches tab so parent can update hero leader. */
  onViewChange?: (view: StandingsView) => void;
}

const STANDINGS_VIEWS: { id: StandingsView; label: string; icon: typeof Trophy }[] = [
  { id: 'NORMALISED', label: 'Normalised', icon: Calculator },
  { id: 'PPG', label: 'PPG', icon: LayoutList },
  { id: 'TABLE', label: 'Table', icon: Trophy },
];

export const Standings: React.FC<StandingsProps> = ({
  players,
  view: controlledView,
  onViewChange,
}) => {
  const [internalView, setInternalView] = React.useState<StandingsView>('NORMALISED');
  const view = controlledView ?? internalView;
  const setView = (v: StandingsView) => {
    onViewChange?.(v);
    if (controlledView == null) setInternalView(v);
  };

  const sortedPlayers = getSortedByView(players, view);

  if (players.length === 0) {
    return (
      <div className="glass-card text-center py-20 px-6">
        <div className="w-16 h-16 rounded-2xl bg-glass-light border border-glass-border mx-auto mb-5 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-text-muted" />
        </div>
        <p className="text-text-secondary text-lg font-semibold">League not started</p>
        <p className="text-sm text-text-muted mt-1">Add players to begin the season.</p>
      </div>
    );
  }

  const RankBadge = ({ index }: { index: number }) => {
    if (index === 0) return (
      <div className="w-7 h-7 rounded-lg rank-1 flex items-center justify-center">
        <Crown className="w-3.5 h-3.5" />
      </div>
    );
    if (index === 1) return (
      <div className="w-7 h-7 rounded-lg rank-2 flex items-center justify-center">
        <Medal className="w-3.5 h-3.5" />
      </div>
    );
    if (index === 2) return (
      <div className="w-7 h-7 rounded-lg rank-3 flex items-center justify-center">
        <Award className="w-3.5 h-3.5" />
      </div>
    );
    return (
      <div className="w-7 h-7 rounded-lg bg-glass-light flex items-center justify-center">
        <span className="text-xs font-bold text-text-muted font-mono">{index + 1}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 3 Tabs on the left + formula descriptions below */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-start">
          <div className="glass-card p-1 inline-flex gap-1">
            {STANDINGS_VIEWS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  view === id
                    ? id === 'NORMALISED'
                      ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/20'
                      : id === 'PPG'
                        ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/20'
                        : 'bg-accent-green/15 text-accent-green border border-accent-green/20'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="text-[11px] text-text-muted leading-relaxed space-y-1.5 max-w-2xl">
          <p>
            <span className="font-semibold text-accent-gold">Normalised:</span> Points ÷ (Matches played + 2), then + a small bonus for goal difference per game. Favours consistency over many games and rewards both results and dominance.
          </p>
          <p>
            <span className="font-semibold text-accent-gold">PPG:</span> Points ÷ Matches played. Raw average points per game (win = 3, draw = 1, loss = 0).
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left data-table">
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                <th className="min-w-[140px]">Player</th>
                <th className="text-center">MP</th>
                {view === 'NORMALISED' && <th className="text-center text-accent-gold">Norm</th>}
                {view === 'PPG' && <th className="text-center text-accent-gold">PPG</th>}
                <th className="text-center hidden sm:table-cell">W</th>
                <th className="text-center hidden sm:table-cell">D</th>
                <th className="text-center hidden sm:table-cell">L</th>
                <th className="text-center hidden md:table-cell">GD</th>
                {view === 'TABLE' && <th className="text-center text-accent-green">PTS</th>}
                <th className="text-center">Form</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, index) => {
                const ppg = player.played > 0 ? (player.points / player.played).toFixed(2) : '0.00';
                const norm = getNormalisedScoreDisplay(player);
                return (
                  <tr key={player.id} className="group">
                    <td className="text-center">
                      <RankBadge index={index} />
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <img
                          src={player.avatarUrl}
                          alt={player.name}
                          className="avatar w-8 h-8 sm:w-9 sm:h-9"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`;
                          }}
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-text-primary text-sm group-hover:text-accent-green transition-colors truncate">
                            {player.name}
                          </div>
                          {index === 0 && (
                            <div className="text-[9px] font-bold text-accent-gold uppercase tracking-widest mt-0.5">Leader</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-center font-mono font-medium text-text-secondary text-sm">{player.played}</td>

                    {view === 'NORMALISED' && (
                      <td className="text-center font-mono font-bold text-lg text-accent-gold">{norm}</td>
                    )}
                    {view === 'PPG' && (
                      <td className="text-center font-mono font-bold text-lg text-accent-gold">{ppg}</td>
                    )}

                    <td className="text-center font-mono font-medium text-text-secondary text-sm hidden sm:table-cell">{player.wins}</td>
                    <td className="text-center font-mono font-medium text-text-secondary text-sm hidden sm:table-cell">{player.draws}</td>
                    <td className="text-center font-mono font-medium text-text-secondary text-sm hidden sm:table-cell">{player.losses}</td>

                    <td className={`text-center font-mono font-semibold text-sm hidden md:table-cell ${
                      player.gd > 0 ? 'text-accent-green' : player.gd < 0 ? 'text-accent-red' : 'text-text-muted'
                    }`}>
                      {player.gd > 0 ? '+' : ''}{player.gd}
                    </td>

                    {view === 'TABLE' && (
                      <td className="text-center font-mono font-bold text-lg text-accent-green">{player.points}</td>
                    )}

                    <td>
                      <div className="flex items-center justify-center gap-1">
                        {player.form.slice(-5).map((result, i) => (
                          <div
                            key={i}
                            className={`result-badge ${
                              result === 'W'
                                ? 'bg-accent-green/15 text-accent-green border border-accent-green/20'
                                : result === 'D'
                                  ? 'bg-glass-strong text-text-secondary border border-glass-border'
                                  : 'bg-accent-red/15 text-accent-red border border-accent-red/20'
                            }`}
                          >
                            {result}
                          </div>
                        ))}
                        {player.form.length === 0 && (
                          <span className="text-[10px] text-text-muted">—</span>
                        )}
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
