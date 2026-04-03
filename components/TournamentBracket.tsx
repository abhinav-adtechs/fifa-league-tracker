import React from 'react';
import { Tournament, TournamentParticipant } from '../types';
import { GitBranch, Trophy } from 'lucide-react';

interface TournamentBracketProps {
  tournament: Tournament;
  onStartKnockout?: () => void;
  canManage?: boolean;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournament,
  onStartKnockout,
  canManage = false,
}) => {
  const rounds = [...tournament.fixtures]
    .filter((fixture) => fixture.stage === 'KNOCKOUT')
    .sort((a, b) => a.roundIndex - b.roundIndex || a.matchIndex - b.matchIndex)
    .reduce<Map<number, typeof tournament.fixtures>>((map, fixture) => {
      const roundFixtures = map.get(fixture.roundIndex) ?? [];
      roundFixtures.push(fixture);
      map.set(fixture.roundIndex, roundFixtures);
      return map;
    }, new Map());

  const participantMap = tournament.participants.reduce<Record<string, TournamentParticipant>>((acc, participant) => {
    acc[participant.id] = participant;
    return acc;
  }, {});

  if (rounds.size === 0) {
    return (
      <div className="glass-card text-center py-16 px-6">
        <div className="w-14 h-14 rounded-2xl bg-glass-light border border-glass-border mx-auto mb-4 flex items-center justify-center">
          <GitBranch className="w-7 h-7 text-text-muted" />
        </div>
        <p className="text-text-secondary font-semibold">Knockout bracket not ready yet</p>
        <p className="text-sm text-text-muted mt-1">
          {onStartKnockout
            ? 'Finish the league stage and seed the qualifiers to build the bracket.'
            : 'This tournament does not have knockout fixtures yet.'}
        </p>
        {onStartKnockout && canManage && (
          <button onClick={onStartKnockout} className="btn-primary mt-5 px-5 py-2.5 text-sm">
            Build Knockout Bracket
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card overflow-x-auto">
      <div className="p-4 sm:p-6 min-w-[720px]">
        <div className="flex items-center gap-2 mb-5">
          <GitBranch className="w-4 h-4 text-accent-purple" />
          <h3 className="text-sm font-semibold text-text-primary">Knockout Bracket</h3>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${rounds.size}, minmax(200px, 1fr))` }}>
          {Array.from(rounds.entries()).map(([roundIndex, fixtures]) => (
            <div key={roundIndex} className="space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                {fixtures[0]?.roundName ?? `Round ${roundIndex + 1}`}
              </div>
              {fixtures.map((fixture) => {
                const player1 = fixture.participant1Id ? participantMap[fixture.participant1Id] : undefined;
                const player2 = fixture.participant2Id ? participantMap[fixture.participant2Id] : undefined;

                return (
                  <div key={fixture.id} className="rounded-2xl border border-glass-border bg-glass-light p-3 space-y-2">
                    {[player1, player2].map((player, index) => {
                      const participantId = index === 0 ? fixture.participant1Id : fixture.participant2Id;
                      const isWinner = participantId && fixture.winnerId === participantId;

                      return (
                        <div
                          key={participantId || `slot-${index}`}
                          className={`rounded-xl border px-3 py-2 flex items-center justify-between gap-2 ${
                            isWinner
                              ? 'border-accent-green/25 bg-accent-green/10 text-accent-green'
                              : 'border-glass-border bg-surface-2/50 text-text-secondary'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">{player?.name ?? 'TBD'}</div>
                            <div className="text-[10px] uppercase tracking-wider truncate opacity-70">
                              {player?.teamName ?? 'Waiting'}
                            </div>
                          </div>
                          {isWinner && <Trophy className="w-3.5 h-3.5 shrink-0" />}
                        </div>
                      );
                    })}

                    <div className="text-[10px] text-text-muted font-medium uppercase tracking-wider">
                      {fixture.matchId
                        ? 'Completed'
                        : fixture.status === 'BYE'
                          ? 'Bye'
                          : fixture.status === 'READY'
                            ? 'Ready'
                            : 'Pending'}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
