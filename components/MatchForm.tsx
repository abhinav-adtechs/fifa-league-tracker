import React, { useState } from 'react';
import { Player } from '../types';
import { Check, X, Swords } from 'lucide-react';

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

  const p1 = players.find(p => p.id === p1Id);
  const p2 = players.find(p => p.id === p2Id);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal-content">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-green/40 to-transparent"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
                <Swords className="w-4 h-4 text-accent-green" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary">Record Result</h2>
                <p className="text-[11px] text-text-muted mt-0.5">Enter match details below</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-lg bg-glass-light border border-glass-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-glass-border-hover transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* Players Row */}
          <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-end">
            {/* Player 1 */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block text-center">Home</label>
              {p1 && (
                <div className="flex justify-center mb-1">
                  <img src={p1.avatarUrl} alt={p1.name} className="avatar w-10 h-10"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${p1.name}`; }}
                  />
                </div>
              )}
              <select
                value={p1Id}
                onChange={(e) => setP1Id(e.target.value)}
                className="select-field w-full text-center text-xs"
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
                className="input-field text-center text-3xl sm:text-4xl font-extrabold font-mono py-4"
              />
            </div>

            <div className="text-text-muted font-bold text-sm pb-6">VS</div>

            {/* Player 2 */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block text-center">Away</label>
              {p2 && (
                <div className="flex justify-center mb-1">
                  <img src={p2.avatarUrl} alt={p2.name} className="avatar w-10 h-10"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${p2.name}`; }}
                  />
                </div>
              )}
              <select
                value={p2Id}
                onChange={(e) => setP2Id(e.target.value)}
                className="select-field w-full text-center text-xs"
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
                className="input-field text-center text-3xl sm:text-4xl font-extrabold font-mono py-4"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="btn-ghost flex-1 py-3 flex items-center justify-center gap-2 text-sm font-semibold"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            <button
              type="submit"
              disabled={!valid}
              className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                valid
                  ? 'btn-primary'
                  : 'bg-glass-light text-text-muted border border-glass-border cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" /> Record Match
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
