import React, { useMemo, useState } from 'react';
import { PlayerProfile, Tournament, TournamentParticipant } from '../types';
import { Plus, UserPlus, ShieldCheck, Trash2, Users } from 'lucide-react';

interface TournamentSquadProps {
  tournament: Tournament;
  playerPool: PlayerProfile[];
  canManage: boolean;
  onCreatePlayerProfile: (name: string) => void;
  onAddParticipant: (profileId: string, teamName: string) => void;
  onUpdateParticipantTeam: (participantId: string, teamName: string) => void;
  onRemoveParticipant: (participantId: string) => void;
}

export const TournamentSquad: React.FC<TournamentSquadProps> = ({
  tournament,
  playerPool,
  canManage,
  onCreatePlayerProfile,
  onAddParticipant,
  onUpdateParticipantTeam,
  onRemoveParticipant,
}) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [selectedTeamName, setSelectedTeamName] = useState('');

  const availableProfiles = useMemo(() => {
    const existingProfileIds = new Set(tournament.participants.map((participant) => participant.profileId));
    return playerPool.filter((profile) => !existingProfileIds.has(profile.id));
  }, [playerPool, tournament.participants]);

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;
    onCreatePlayerProfile(trimmed);
    setNewPlayerName('');
  };

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId || !selectedTeamName.trim()) return;
    onAddParticipant(selectedProfileId, selectedTeamName.trim());
    setSelectedProfileId('');
    setSelectedTeamName('');
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-green/30 to-transparent"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-accent-green/10 border border-accent-green/20 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-accent-green" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Player Pool</h3>
              <p className="text-[11px] text-text-muted">Add guests who are not part of the main league</p>
            </div>
          </div>

          <form onSubmit={handleCreateProfile} className="space-y-3">
            <input
              type="text"
              value={newPlayerName}
              disabled={!canManage}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Add a player to the global pool..."
              className="input-field w-full"
            />
            <button
              type="submit"
              disabled={!canManage || !newPlayerName.trim()}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" /> Add to Pool
            </button>
          </form>
        </div>

        <div className="glass-card p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-purple/30 to-transparent"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-accent-purple" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Tournament Squad</h3>
              <p className="text-[11px] text-text-muted">Select a player from the pool and assign their team</p>
            </div>
          </div>

          <form onSubmit={handleAddParticipant} className="space-y-3">
            <select
              value={selectedProfileId}
              disabled={!canManage || availableProfiles.length === 0}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="select-field w-full"
            >
              <option value="">Select player</option>
              {availableProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={selectedTeamName}
              disabled={!canManage}
              onChange={(e) => setSelectedTeamName(e.target.value)}
              placeholder="Team / club name"
              className="input-field w-full"
            />
            <button
              type="submit"
              disabled={!canManage || !selectedProfileId || !selectedTeamName.trim()}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" /> Add to Tournament
            </button>
          </form>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-glass-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-accent-blue" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Registered Players</h3>
            <p className="text-[10px] text-text-muted">{tournament.participants.length} player{tournament.participants.length !== 1 ? 's' : ''} in this tournament</p>
          </div>
        </div>

        <div className="p-3 sm:p-4">
          {tournament.participants.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-40" />
              <p className="text-sm text-text-muted">No players added yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tournament.participants.map((participant) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  canManage={canManage}
                  onUpdateParticipantTeam={onUpdateParticipantTeam}
                  onRemoveParticipant={onRemoveParticipant}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card p-4 flex gap-3 items-start border-accent-blue/15">
        <div className="w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/15 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-accent-blue" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-accent-blue">Shared Player Pool</h4>
          <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
            Players live in a platform-wide pool, but their chosen team stays unique to this tournament.
          </p>
        </div>
      </div>
    </div>
  );
};

const ParticipantCard: React.FC<{
  participant: TournamentParticipant;
  canManage: boolean;
  onUpdateParticipantTeam: (participantId: string, teamName: string) => void;
  onRemoveParticipant: (participantId: string) => void;
}> = ({ participant, canManage, onUpdateParticipantTeam, onRemoveParticipant }) => {
  const [teamName, setTeamName] = useState(participant.teamName);

  return (
    <div className="p-3 rounded-xl bg-glass-light border border-glass-border hover:border-glass-border-hover transition-all">
      <div className="flex items-center gap-3">
        <img
          src={participant.avatarUrl}
          alt={participant.name}
          className="avatar w-10 h-10 shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.name}`;
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-text-primary text-sm truncate">{participant.name}</div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider">Tournament Player</div>
        </div>
        {canManage && (
          <button
            onClick={() => onRemoveParticipant(participant.id)}
            className="text-text-muted hover:text-accent-red hover:bg-accent-red/10 p-2 rounded-lg transition-all shrink-0"
            title="Remove Player"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={teamName}
          disabled={!canManage}
          onChange={(e) => setTeamName(e.target.value)}
          className="input-field flex-1"
          placeholder="Team name"
        />
        {canManage && (
          <button
            onClick={() => onUpdateParticipantTeam(participant.id, teamName)}
            className="btn-ghost px-4 text-sm"
            type="button"
          >
            Save
          </button>
        )}
      </div>
    </div>
  );
};
