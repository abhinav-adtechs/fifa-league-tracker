import React, { useState, useEffect } from 'react';
import { auth, LoginAuditEntry } from '../services/auth';
import { Clock, CheckCircle, XCircle, RefreshCw, User, Globe, History } from 'lucide-react';

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
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-accent-blue/30 to-transparent"></div>
      
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
              <History className="w-4 h-4 text-accent-blue" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">Login History</h3>
          </div>
          <button
            onClick={loadAudit}
            disabled={loading}
            className="btn-ghost flex items-center gap-2 text-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-text-muted" />
            <div className="text-sm text-text-muted">Loading history...</div>
          </div>
        ) : auditEntries.length === 0 ? (
          <div className="text-center py-12 bg-glass-light rounded-xl border border-glass-border">
            <Clock className="w-8 h-8 mx-auto mb-2 text-text-muted opacity-40" />
            <p className="text-sm text-text-muted">No login attempts recorded</p>
          </div>
        ) : (
          <div className="space-y-2">
            {auditEntries.map((entry) => (
              <div
                key={entry.id}
                className={`p-3 sm:p-4 rounded-xl border transition-colors ${
                  entry.success
                    ? 'bg-accent-green/3 border-accent-green/10 hover:border-accent-green/20'
                    : 'bg-accent-red/3 border-accent-red/10 hover:border-accent-red/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  {entry.success ? (
                    <CheckCircle className="w-4 h-4 text-accent-green shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-accent-red shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-text-primary text-sm">
                        {entry.admin_name_snapshot}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                        entry.success
                          ? 'bg-accent-green/10 text-accent-green border border-accent-green/15'
                          : 'bg-accent-red/10 text-accent-red border border-accent-red/15'
                      }`}>
                        {entry.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-text-muted flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDate(entry.login_at)}
                      </span>
                      {entry.ip_address && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" />
                          {entry.ip_address}
                        </span>
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
