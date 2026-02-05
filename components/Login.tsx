import React, { useState } from 'react';
import { auth, Admin } from '../services/auth';
import { Lock, LogIn, LogOut, User, AlertCircle } from 'lucide-react';

interface LoginProps {
  currentAdmin: Admin | null;
  onLogin: (admin: Admin) => void;
  onLogout: () => void;
}

export const Login: React.FC<LoginProps> = ({ currentAdmin, onLogin, onLogout }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await auth.login(password);
    setLoading(false);

    if (result.success && result.admin) {
      onLogin(result.admin);
      setPassword('');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  const handleLogout = () => {
    auth.logout();
    onLogout();
  };

  if (currentAdmin) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-fifa-card p-4 sm:p-6 rounded-2xl border border-fifa-surface shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
            <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-white">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-fifa-accent" /> Admin Session
            </h3>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 sm:px-4 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
          <div className="bg-fifa-dark p-3 sm:p-4 rounded-xl border border-fifa-surface">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-fifa-accent/20 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-fifa-accent" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm text-gray-400 uppercase font-bold tracking-wider">Logged in as</div>
                <div className="text-lg sm:text-xl font-black text-white truncate">{currentAdmin.name}</div>
              </div>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-green-900/20 border border-green-500/30 rounded-xl">
            <div className="text-xs sm:text-sm text-green-400 font-bold">✓ Admin Access Active</div>
            <div className="text-[10px] sm:text-xs text-green-300/70 mt-1">
              You can now add matches, manage players, and modify resources.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-fifa-card p-4 sm:p-6 rounded-2xl border border-fifa-surface shadow-xl">
        <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 text-white">
          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-fifa-accent" /> Admin Login
        </h3>
        
        <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password..."
              className="w-full bg-fifa-dark border border-fifa-surface rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-fifa-muted focus:outline-none focus:border-fifa-accent transition-colors"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 p-2.5 sm:p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 shrink-0" />
              <div className="text-xs sm:text-sm text-red-400">{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full bg-fifa-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-yellow-900/30 text-sm sm:text-base"
          >
            <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
          <div className="text-[10px] sm:text-xs text-blue-300/70 leading-relaxed">
            <strong className="text-blue-400">Note:</strong> Viewing is not restricted. Only admin actions (adding matches, managing players) require authentication.
          </div>
        </div>
      </div>
    </div>
  );
};
