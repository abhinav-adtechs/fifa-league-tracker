import React, { useState, useEffect } from 'react';
import { auth, LoginAuditEntry } from '../services/auth';
import { Clock, CheckCircle, XCircle, RefreshCw, User, Globe } from 'lucide-react';

export const LoginDetails: React.FC = () => {
  const [auditEntries, setAuditEntries] = useState<LoginAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAudit = async () => {
    setLoading(true);
    const entries = await auth.getLoginAudit(100);
    setAuditEntries(entries);
    setLoading(false);
  };

  useEffect(() => {
    loadAudit();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="bg-fifa-card p-6 rounded-2xl border border-fifa-surface shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-fifa-accent" /> Login History
          </h3>
          <button
            onClick={loadAudit}
            disabled={loading}
            className="bg-fifa-dark hover:bg-fifa-surface border border-fifa-surface text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <div>Loading login history...</div>
          </div>
        ) : auditEntries.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-fifa-dark rounded-xl border border-fifa-surface">
            <Clock className="w-12 h-12 mx-auto mb-2 text-gray-600" />
            <p>No login attempts recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {auditEntries.map((entry) => (
              <div
                key={entry.id}
                className={`p-4 rounded-xl border ${
                  entry.success
                    ? 'bg-green-900/10 border-green-500/30'
                    : 'bg-red-900/10 border-red-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {entry.success ? (
                      <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-bold text-white">
                          {entry.admin_name_snapshot}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-bold ${
                            entry.success
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {entry.success ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(entry.login_at)}
                        </span>
                        {entry.ip_address && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {entry.ip_address}
                          </span>
                        )}
                      </div>
                      {entry.user_agent && (
                        <div className="text-xs text-gray-500 mt-1 truncate" title={entry.user_agent}>
                          {entry.user_agent}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
