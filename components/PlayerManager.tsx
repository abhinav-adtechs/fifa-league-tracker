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
      <div className="bg-fifa-card p-4 sm:p-6 rounded-2xl border border-fifa-surface shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-fifa-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 text-white relative z-10">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-fifa-accent" /> New Signing
        </h3>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-3 relative z-10">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter player name..."
            className="flex-1 bg-fifa-dark border border-fifa-surface rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-fifa-muted focus:outline-none focus:border-fifa-accent transition-colors"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="bg-fifa-accent text-black font-bold px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-yellow-900/30 text-sm sm:text-base"
          >
            Add
          </button>
        </form>
      </div>

      <div className="bg-fifa-card p-4 sm:p-6 rounded-2xl border border-fifa-surface shadow-xl">
        <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 text-white">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-fifa-accent" /> Squad List
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
          {players.length === 0 ? (
             <p className="text-gray-500 italic col-span-2 text-center py-4 text-sm sm:text-base">No players registered yet.</p>
          ) : (
            players.map((player) => (
                <div key={player.id} className="flex items-center justify-between bg-fifa-dark p-2.5 sm:p-3 rounded-xl border border-fifa-surface group">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <img 
                            src={player.avatarUrl} 
                            alt={player.name} 
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-fifa-surface object-cover shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}&backgroundColor=fae100,6b46c1,1a1625`;
                            }}
                        />
                        <span className="font-bold text-gray-200 text-sm sm:text-base truncate">{player.name}</span>
                    </div>
                    {player.played === 0 ? (
                        <button
                        onClick={() => onDeletePlayer(player.id)}
                        className="text-gray-500 hover:text-red-500 hover:bg-red-500/10 p-1.5 sm:p-2 rounded-lg transition-colors shrink-0"
                        title="Delete Player"
                        >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                    ) : (
                        <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-wider text-fifa-green bg-fifa-green/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-fifa-green/20 shrink-0">
                            Active
                        </span>
                    )}
                </div>
            ))
          )}
        </div>
      </div>
      
      <div className="bg-blue-900/20 border border-blue-500/30 p-3 sm:p-4 rounded-xl flex gap-2 sm:gap-3 items-start">
        <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
            <h4 className="text-xs sm:text-sm font-bold text-blue-400">Database Info</h4>
            <p className="text-[10px] sm:text-xs text-blue-200/70 mt-1 leading-relaxed">
                This app currently uses your browser's local storage. To share a live link with friends, 
                this app needs to be deployed to a hosting provider (like Vercel) and connected to a database (like Firebase).
            </p>
        </div>
      </div>
    </div>
  );
};
