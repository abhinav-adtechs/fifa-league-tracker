import React, { useState } from 'react';
import { Player } from '../types';
import { Plus, Trash2, User, ShieldCheck, UserPlus } from 'lucide-react';

interface PlayerManagerProps {
  players: Player[];
  onAddPlayer: (name: string) => void;
  onDeletePlayer: (id: string) => void;
}

export const PlayerManager: React.FC<PlayerManagerProps> = ({ players, onAddPlayer, onDeletePlayer }) => {
  const [newName, setNewName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddPlayer(newName.trim());
      setNewName('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Player Card */}
      <div className="glass-card p-5 sm:p-6 relative overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-green/30 to-transparent"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent-green/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-3 mb-4 relative">
          <div className="w-9 h-9 rounded-xl bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
            <UserPlus className="w-4 h-4 text-accent-green" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">New Signing</h3>
            <p className="text-[11px] text-text-muted">Add a new player to the squad</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 relative">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter player name..."
            className="input-field flex-1"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="btn-primary flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none sm:min-w-[100px]"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>
      </div>

      {/* Squad List */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-glass-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center">
            <User className="w-4 h-4 text-accent-purple" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Squad List</h3>
            <p className="text-[10px] text-text-muted">{players.length} player{players.length !== 1 ? 's' : ''} registered</p>
          </div>
        </div>

        <div className="p-3 sm:p-4">
          {players.length === 0 ? (
            <div className="text-center py-10">
              <User className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-40" />
              <p className="text-sm text-text-muted">No players registered yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-glass-light border border-glass-border hover:border-glass-border-hover transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={player.avatarUrl}
                      alt={player.name}
                      className="avatar w-9 h-9 shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`;
                      }}
                    />
                    <div className="min-w-0">
                      <span className="font-semibold text-text-primary text-sm truncate block">{player.name}</span>
                      {player.played > 0 && (
                        <span className="text-[10px] text-text-muted">{player.played} matches</span>
                      )}
                    </div>
                  </div>
                  {player.played === 0 ? (
                    <button
                      onClick={() => onDeletePlayer(player.id)}
                      className="text-text-muted hover:text-accent-red hover:bg-accent-red/10 p-2 rounded-lg transition-all shrink-0 opacity-0 group-hover:opacity-100"
                      title="Remove Player"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-accent-green/8 border border-accent-green/15 shrink-0">
                      <ShieldCheck className="w-3 h-3 text-accent-green" />
                      <span className="text-[9px] font-semibold text-accent-green uppercase tracking-wider">Active</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="glass-card p-4 flex gap-3 items-start border-accent-blue/15">
        <div className="w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/15 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-accent-blue" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-accent-blue">Cloud Storage</h4>
          <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
            All data is synced to the cloud via Supabase. Changes are reflected in real-time across all devices.
          </p>
        </div>
      </div>
    </div>
  );
};
