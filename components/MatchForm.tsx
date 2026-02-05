import React, { useState } from 'react';
import { Player } from '../types';
import { Check, X } from 'lucide-react';

interface MatchFormProps {
  players: Player[];
  onAddMatch: (p1Id: string, p2Id: string, s1: number, s2: number) => void;
  onCancel: () => void;
}

export const MatchForm: React.FC<MatchFormProps> = ({ players, onAddMatch, onCancel }) => {
  const [p1Id, setP1Id] = useState<string>('');
  const [p2Id, setP2Id] = useState<string>('');
  const [s1, setS1] = useState<string>('');
  const [s2, setS2] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p1Id || !p2Id || p1Id === p2Id || s1 === '' || s2 === '') return;
    
    onAddMatch(p1Id, p2Id, parseInt(s1), parseInt(s2));
  };

  const valid = p1Id && p2Id && p1Id !== p2Id && s1 !== '' && s2 !== '';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-fifa-card w-full max-w-lg rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-fifa-green to-fifa-accent p-3 sm:p-4">
            <h2 className="text-lg sm:text-xl font-bold text-white text-center">Record Result</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-[1fr,auto,1fr] gap-2 sm:gap-4 items-center">
            
            {/* Player 1 Side */}
            <div className="space-y-1.5 sm:space-y-2">
                <label className="block text-[10px] sm:text-xs font-bold text-gray-400 uppercase text-center">Home</label>
                <select 
                    value={p1Id} 
                    onChange={(e) => setP1Id(e.target.value)}
                    className="w-full bg-fifa-dark border border-fifa-surface rounded-lg p-1.5 sm:p-2 text-xs sm:text-sm text-white text-center focus:border-fifa-accent outline-none appearance-none"
                >
                    <option value="">Select</option>
                    {players.map(p => <option key={p.id} value={p.id} disabled={p.id === p2Id}>{p.name}</option>)}
                </select>
                <input 
                    type="number" 
                    min="0"
                    value={s1}
                    onChange={(e) => setS1(e.target.value)}
                    placeholder="0"
                    className="w-full bg-fifa-dark border border-fifa-surface rounded-xl p-3 sm:p-4 text-center text-2xl sm:text-4xl font-mono font-black text-white focus:border-fifa-accent outline-none"
                />
            </div>

            <div className="text-gray-500 font-bold text-base sm:text-xl pt-4 sm:pt-6">VS</div>

            {/* Player 2 Side */}
            <div className="space-y-1.5 sm:space-y-2">
                <label className="block text-[10px] sm:text-xs font-bold text-gray-400 uppercase text-center">Away</label>
                <select 
                    value={p2Id} 
                    onChange={(e) => setP2Id(e.target.value)}
                    className="w-full bg-fifa-dark border border-fifa-surface rounded-lg p-1.5 sm:p-2 text-xs sm:text-sm text-white text-center focus:border-fifa-accent outline-none appearance-none"
                >
                    <option value="">Select</option>
                    {players.map(p => <option key={p.id} value={p.id} disabled={p.id === p1Id}>{p.name}</option>)}
                </select>
                <input 
                    type="number" 
                    min="0"
                    value={s2}
                    onChange={(e) => setS2(e.target.value)}
                    placeholder="0"
                    className="w-full bg-fifa-dark border border-fifa-surface rounded-xl p-3 sm:p-4 text-center text-2xl sm:text-4xl font-mono font-black text-white focus:border-fifa-accent outline-none"
                />
            </div>
          </div>

          <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button 
                type="button" 
                onClick={onCancel}
                className="flex-1 py-2.5 sm:py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
                <X className="w-4 h-4 sm:w-5 sm:h-5" /> Cancel
            </button>
            <button 
                type="submit" 
                disabled={!valid}
                className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base
                    ${valid ? 'bg-fifa-accent text-black hover:opacity-90 shadow-lg shadow-yellow-900/30' : 'bg-fifa-surface text-fifa-muted cursor-not-allowed'}`}
            >
                <Check className="w-4 h-4 sm:w-5 sm:h-5" /> Record Match
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
