import React, { useState } from 'react';
import { Player } from '../types';
import { Plus, Trash2, User, ShieldAlert } from 'lucide-react';

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
      <div className="bg-fifa-card p-6 rounded-2xl border border-fifa-surface shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-fifa-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white relative z-10">
          <Plus className="w-5 h-5 text-fifa-green" /> New Signing
        </h3>
        
        <form onSubmit={handleSubmit} className="flex gap-3 relative z-10">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter player name..."
            className="flex-1 bg-fifa-dark border border-fifa-surface rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-fifa-green transition-colors"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="bg-fifa-green text-black font-bold px-6 py-3 rounded-xl hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-900/20"
          >
            Add
          </button>
        </form>
      </div>

      <div className="bg-fifa-card p-6 rounded-2xl border border-fifa-surface shadow-xl">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <User className="w-5 h-5 text-fifa-accent" /> Squad List
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {players.length === 0 ? (
             <p className="text-gray-500 italic col-span-2 text-center py-4">No players registered yet.</p>
          ) : (
            players.map((player) => (
                <div key={player.id} className="flex items-center justify-between bg-fifa-dark p-3 rounded-xl border border-fifa-surface group">
                    <div className="flex items-center gap-3">
                        <img src={player.avatarUrl} alt={player.name} className="w-10 h-10 rounded-full bg-fifa-surface" />
                        <span className="font-bold text-gray-200">{player.name}</span>
                    </div>
                    {player.played === 0 ? (
                        <button
                        onClick={() => onDeletePlayer(player.id)}
                        className="text-gray-500 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                        title="Delete Player"
                        >
                        <Trash2 className="w-4 h-4" />
                        </button>
                    ) : (
                        <span className="text-[10px] uppercase font-bold tracking-wider text-fifa-green bg-fifa-green/10 px-2 py-1 rounded border border-fifa-green/20">
                            Active
                        </span>
                    )}
                </div>
            ))
          )}
        </div>
      </div>
      
      <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl flex gap-3 items-start">
        <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
            <h4 className="text-sm font-bold text-blue-400">Database Info</h4>
            <p className="text-xs text-blue-200/70 mt-1 leading-relaxed">
                This app currently uses your browser's local storage. To share a live link with friends, 
                this app needs to be deployed to a hosting provider (like Vercel) and connected to a database (like Firebase).
            </p>
        </div>
      </div>
    </div>
  );
};
