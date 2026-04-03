import React, { useState } from 'react';
import { Admin, Tournament } from '../types';
import { AlertCircle, History, KeyRound, LogIn, LogOut, Plus, ShieldCheck, User } from 'lucide-react';

interface TournamentAdminPanelProps {
  tournament: Tournament;
  currentAdmin: Admin | null;
  onLogin: (name: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onLogout: () => void;
  onAddAdmin: (name: string, password: string) => void;
  canManageRoster: boolean;
}

export const TournamentAdminPanel: React.FC<TournamentAdminPanelProps> = ({
  tournament,
  currentAdmin,
  onLogin,
  onLogout,
  onAddAdmin,
  canManageRoster,
}) => {
  const [adminName, setAdminName] = useState(tournament.admins[0]?.name ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await onLogin(adminName, password);
    setLoading(false);
    if (result.success) {
      setPassword('');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="glass-card overflow-hidden">
          <div className="h-px bg-gradient-to-r from-transparent via-accent-purple/40 to-transparent"></div>

          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-accent-purple" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Tournament Admin</h3>
                <p className="text-[11px] text-text-muted">Admin access is unique to {tournament.name}</p>
              </div>
            </div>

            {currentAdmin ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-glass-light border border-glass-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-green/20 to-accent-purple/20 border border-glass-border flex items-center justify-center">
                      <User className="w-6 h-6 text-accent-green" />
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Logged in as</div>
                      <div className="text-lg font-bold text-text-primary">{currentAdmin.name}</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-accent-green/5 border border-accent-green/10 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-accent-green shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-accent-green">Tournament admin access active</div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      You can manage this tournament’s squad, results, and admin roster.
                    </div>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="btn-ghost flex items-center gap-2 text-sm text-accent-red border-accent-red/20 hover:bg-accent-red/10 w-full justify-center"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-2">
                    Admin
                  </label>
                  <select value={adminName} onChange={(e) => setAdminName(e.target.value)} className="select-field w-full" disabled={loading}>
                    <option value="">Select admin</option>
                    {tournament.admins.map((admin) => (
                      <option key={admin.id} value={admin.name}>
                        {admin.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter tournament admin password..."
                    className="input-field"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-accent-red/8 border border-accent-red/15 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-accent-red shrink-0" />
                    <span className="text-xs font-medium text-accent-red">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !adminName || !password.trim()}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <LogIn className="w-4 h-4" />
                  {loading ? 'Authenticating...' : 'Login'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="h-px bg-gradient-to-r from-transparent via-accent-blue/30 to-transparent"></div>
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
                <History className="w-4 h-4 text-accent-blue" />
              </div>
              <h3 className="text-sm font-bold text-text-primary">Admin Roster</h3>
            </div>

            <div className="space-y-2 mb-5">
              {tournament.admins.map((admin) => (
                <div key={admin.id} className="p-3 rounded-xl border border-glass-border bg-glass-light">
                  <div className="font-semibold text-text-primary text-sm">{admin.name}</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Tournament Admin</div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-glass-light border border-glass-border space-y-3">
              <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Add Admin</div>
              <input
                type="text"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                placeholder="Admin name"
                className="input-field w-full"
                disabled={!canManageRoster}
              />
              <input
                type="password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="Admin password"
                className="input-field w-full"
                disabled={!canManageRoster}
              />
              <button
                onClick={() => {
                  if (!newAdminName.trim() || !newAdminPassword.trim()) return;
                  onAddAdmin(newAdminName.trim(), newAdminPassword.trim());
                  setNewAdminName('');
                  setNewAdminPassword('');
                }}
                type="button"
                disabled={!canManageRoster || !newAdminName.trim() || !newAdminPassword.trim()}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> Add Tournament Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-glass-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
            <History className="w-4 h-4 text-accent-green" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Login History</h3>
            <p className="text-[10px] text-text-muted">Recent admin activity for this tournament</p>
          </div>
        </div>

        <div className="p-3 sm:p-4 space-y-2">
          {tournament.adminAudit.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-sm">No login attempts recorded yet.</div>
          ) : (
            tournament.adminAudit.map((entry) => (
              <div
                key={entry.id}
                className={`p-3 rounded-xl border ${
                  entry.success
                    ? 'bg-accent-green/3 border-accent-green/10'
                    : 'bg-accent-red/3 border-accent-red/10'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-text-primary text-sm">{entry.adminNameSnapshot}</div>
                    <div className="text-[10px] text-text-muted mt-1">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                      entry.success
                        ? 'bg-accent-green/10 text-accent-green border border-accent-green/15'
                        : 'bg-accent-red/10 text-accent-red border border-accent-red/15'
                    }`}
                  >
                    {entry.success ? 'Success' : 'Failed'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
