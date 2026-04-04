import React from "react";
import { Tournament, TournamentFixture, TournamentParticipant } from "../types";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  GitBranch,
  SkipForward,
  Trophy,
} from "lucide-react";
import {
  createKnockoutFixtures,
  getQualifiedParticipants,
  isLeagueComplete,
} from "../utils/tournaments";

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
  const actualKnockoutFixtures = [...tournament.fixtures]
    .filter((fixture) => fixture.stage === "KNOCKOUT")
    .sort((a, b) => a.roundIndex - b.roundIndex || a.matchIndex - b.matchIndex);
  const leagueComplete =
    tournament.type === "LEAGUE_KNOCKOUT" ? isLeagueComplete(tournament) : true;
  const knockoutMatchesPlayed = tournament.matches.some(
    (match) => match.stage === "KNOCKOUT",
  );
  const projectedKnockoutFixtures =
    tournament.type === "LEAGUE_KNOCKOUT"
      ? createKnockoutFixtures(
          getQualifiedParticipants(tournament).map(
            (participant) => participant.id,
          ),
        )
      : [];
  const showProjectedBracket =
    tournament.type === "LEAGUE_KNOCKOUT" &&
    !knockoutMatchesPlayed &&
    projectedKnockoutFixtures.length > 0 &&
    (!leagueComplete || actualKnockoutFixtures.length === 0);
  const knockoutFixtures = (
    showProjectedBracket ? projectedKnockoutFixtures : actualKnockoutFixtures
  ).sort((a, b) => a.roundIndex - b.roundIndex || a.matchIndex - b.matchIndex);
  const showCurrentLeagueStatus = showProjectedBracket && !leagueComplete;

  const participantMap = tournament.participants.reduce(
    (acc, participant) => {
      acc[participant.id] = participant;
      return acc;
    },
    {} as Record<string, TournamentParticipant>,
  );

  const maxKnockoutRoundIndex = knockoutFixtures.reduce(
    (max, f) => Math.max(max, f.roundIndex),
    -1,
  );
  const fixturesInLastRound = knockoutFixtures.filter(
    (f) => f.roundIndex === maxKnockoutRoundIndex,
  );
  const finalFixtureForChampion =
    knockoutFixtures.find((f) => f.roundName === "Final") ??
    (fixturesInLastRound.length === 1 ? fixturesInLastRound[0] : undefined);
  const finalHasRecordedWinner = Boolean(
    finalFixtureForChampion?.matchId && finalFixtureForChampion?.winnerId,
  );
  const championParticipant = finalFixtureForChampion?.winnerId
    ? participantMap[finalFixtureForChampion.winnerId]
    : undefined;
  const showWinnerSpotlight = finalFixtureForChampion != null;

  if (knockoutFixtures.length === 0) {
    return (
      <div className="glass-card text-center py-16 px-6">
        <div className="w-14 h-14 rounded-2xl bg-glass-light border border-glass-border mx-auto mb-4 flex items-center justify-center">
          <GitBranch className="w-7 h-7 text-text-muted" />
        </div>
        <p className="text-text-secondary font-semibold">
          Knockout bracket not ready yet
        </p>
        <p className="text-sm text-text-muted mt-1">
          {onStartKnockout
            ? "Finish the league stage and seed the qualifiers to build the bracket."
            : "This tournament does not have knockout fixtures yet."}
        </p>
        {onStartKnockout && canManage && (
          <button
            onClick={onStartKnockout}
            className="btn-primary mt-5 px-5 py-2.5 text-sm"
          >
            Build Knockout Bracket
          </button>
        )}
      </div>
    );
  }

  const semifinals = knockoutFixtures.filter(
    (fixture) => fixture.roundName === "Semi Final",
  );
  const finalFixture = knockoutFixtures.find(
    (fixture) => fixture.roundName === "Final",
  );
  const thirdPlaceFixture = knockoutFixtures.find(
    (fixture) => fixture.roundName === "3rd Place",
  );
  const canRenderSpecialBracket = semifinals.length === 2 && finalFixture;

  if (canRenderSpecialBracket) {
    return (
      <div className="glass-card overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-6">
            <GitBranch className="w-4 h-4 text-accent-purple" />
            <h3 className="text-sm font-semibold text-text-primary">
              Knockout Bracket
            </h3>
          </div>

          {showCurrentLeagueStatus && (
            <div className="mb-5 rounded-2xl border border-accent-2/25 bg-accent-2/12 px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-2">
                Live Projection
              </div>
              <div className="mt-1 text-sm font-semibold text-text-primary">
                As per current league status
              </div>
            </div>
          )}

          {/* 3-col grid: semis | connector | final on row 2; 3rd place on row 3 col 3 only (keeps connector height aligned to semis) */}
          <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_52px_minmax(260px,1fr)] gap-x-0 gap-y-0 items-start">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-3 min-w-0 pr-2">
              Semi Final
            </div>
            <div className="mb-3" aria-hidden />
            <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-3 min-w-0 pl-4 border-l border-white/[0.06]">
              Final
            </div>

            <div className="flex flex-col gap-4 min-w-0 min-h-[220px] pr-2">
              <div className="flex-1 flex items-center min-h-[96px]">
                <div className="w-full relative">
                  <BracketMatchCard
                    fixture={semifinals[0]}
                    participantMap={participantMap}
                    suppressReady={showCurrentLeagueStatus}
                  />
                  <div
                    className="pointer-events-none absolute top-1/2 right-0 w-3 h-px bg-white/20 -translate-y-1/2 translate-x-full"
                    aria-hidden
                  />
                </div>
              </div>
              <div className="flex-1 flex items-center min-h-[96px]">
                <div className="w-full relative">
                  <BracketMatchCard
                    fixture={semifinals[1]}
                    participantMap={participantMap}
                    suppressReady={showCurrentLeagueStatus}
                  />
                  <div
                    className="pointer-events-none absolute top-1/2 right-0 w-3 h-px bg-white/20 -translate-y-1/2 translate-x-full"
                    aria-hidden
                  />
                </div>
              </div>
            </div>

            <div className="relative w-[52px] shrink-0 min-h-[220px] self-stretch" aria-hidden>
              <div className="absolute inset-0">
                <div className="absolute left-0 top-[25%] w-1/2 h-px bg-white/20" />
                <div className="absolute left-0 bottom-[25%] w-1/2 h-px bg-white/20" />
                <div className="absolute left-1/2 top-[25%] bottom-[25%] w-px bg-white/20 -translate-x-1/2" />
                <div className="absolute left-1/2 right-0 top-1/2 h-px bg-white/30 -translate-y-1/2" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-accent-2/80">
                  <ArrowRight
                    className="w-4 h-4 drop-shadow-sm"
                    strokeWidth={2.25}
                  />
                </div>
                {thirdPlaceFixture && (
                  <>
                    <div
                      className="absolute left-[10px] top-[25%] bottom-[30%] w-px border-l border-dashed border-white/20"
                      style={{ borderLeftStyle: "dashed" }}
                    />
                    <div className="absolute left-[10px] bottom-[30%] right-0 h-px border-t border-dashed border-white/20" />
                  </>
                )}
              </div>
            </div>

            <div className="min-h-[220px] flex flex-col justify-center gap-4 w-full min-w-0 pl-4 border-l border-white/[0.06]">
              <div className="w-full min-w-0">
                <BracketMatchCard
                  fixture={finalFixture}
                  participantMap={participantMap}
                  emphasis="final"
                  suppressReady={showCurrentLeagueStatus}
                />
              </div>
              {showWinnerSpotlight && (
                <TournamentWinnerBlob
                  participant={championParticipant}
                  resolved={finalHasRecordedWinner}
                />
              )}
            </div>

            {thirdPlaceFixture && (
              <>
                <div className="col-span-2 min-h-0" aria-hidden />
                <div className="w-full min-w-0 pl-4 border-l border-white/[0.06] pt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-3">
                    3rd Place
                  </div>
                  <BracketMatchCard
                    fixture={thirdPlaceFixture}
                    participantMap={participantMap}
                    suppressReady={showCurrentLeagueStatus}
                  />
                </div>
              </>
            )}
          </div>

          <div className="lg:hidden space-y-5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-3">
                Semi Finals
              </div>
              <div className="grid gap-4">
                <BracketMatchCard
                  fixture={semifinals[0]}
                  participantMap={participantMap}
                  suppressReady={showCurrentLeagueStatus}
                />
                <BracketMatchCard
                  fixture={semifinals[1]}
                  participantMap={participantMap}
                  suppressReady={showCurrentLeagueStatus}
                />
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-3">
                Final
              </div>
              <BracketMatchCard
                fixture={finalFixture}
                participantMap={participantMap}
                emphasis="final"
                suppressReady={showCurrentLeagueStatus}
              />
              {showWinnerSpotlight && (
                <div className="mt-4">
                  <TournamentWinnerBlob
                    participant={championParticipant}
                    resolved={finalHasRecordedWinner}
                  />
                </div>
              )}
            </div>

            {thirdPlaceFixture && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-3">
                  3rd Place
                </div>
                <BracketMatchCard
                  fixture={thirdPlaceFixture}
                  participantMap={participantMap}
                  suppressReady={showCurrentLeagueStatus}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const rounds = knockoutFixtures.reduce<Map<number, TournamentFixture[]>>(
    (map, fixture) => {
      const roundFixtures = map.get(fixture.roundIndex) ?? [];
      roundFixtures.push(fixture);
      map.set(fixture.roundIndex, roundFixtures);
      return map;
    },
    new Map(),
  );

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <GitBranch className="w-4 h-4 text-accent-purple" />
          <h3 className="text-sm font-semibold text-text-primary">
            Knockout Bracket
          </h3>
        </div>

        {showCurrentLeagueStatus && (
          <div className="mb-4 rounded-2xl border border-accent-2/25 bg-accent-2/12 px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-2">
              Live Projection
            </div>
            <div className="mt-1 text-sm font-semibold text-text-primary">
              As per current league status
            </div>
          </div>
        )}

        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns:
              rounds.size <= 1
                ? "minmax(0, 1fr)"
                : rounds.size === 2
                  ? "repeat(2, minmax(0, 1fr))"
                  : "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {Array.from(rounds.entries()).map(([roundIndex, fixtures]) => (
            <div key={roundIndex} className="space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                {fixtures[0]?.roundName ?? `Round ${roundIndex + 1}`}
              </div>
              {fixtures.map((fixture) => (
                <BracketMatchCard
                  key={fixture.id}
                  fixture={fixture}
                  participantMap={participantMap}
                  suppressReady={showCurrentLeagueStatus}
                />
              ))}
            </div>
          ))}
        </div>

        {showWinnerSpotlight && (
          <div className="mt-6">
            <TournamentWinnerBlob
              participant={championParticipant}
              resolved={finalHasRecordedWinner}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const TournamentWinnerBlob: React.FC<{
  participant?: TournamentParticipant;
  resolved: boolean;
}> = ({ participant, resolved }) => (
  <div
    className={`rounded-[24px] border px-4 py-3.5 flex items-center gap-3 ${
      resolved
        ? "border-accent-gold/30 bg-accent-gold/10 shadow-[0_18px_36px_-28px_rgba(255,215,64,0.45)]"
        : "border-glass-border bg-glass-light opacity-80"
    }`}
  >
    <div
      className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center border ${
        resolved
          ? "bg-accent-gold/15 border-accent-gold/25"
          : "bg-glass-light border-glass-border"
      }`}
      aria-hidden
    >
      <Trophy
        className={`w-5 h-5 ${resolved ? "text-accent-gold" : "text-text-muted"}`}
        strokeWidth={2.25}
      />
    </div>
    <div className="min-w-0 flex-1">
      <div
        className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
          resolved ? "text-accent-gold" : "text-text-muted"
        }`}
      >
        Winner
      </div>
      {!resolved ? (
        <div className="text-sm font-semibold text-text-secondary mt-0.5">
          TBD
        </div>
      ) : participant ? (
        <>
          <div className="text-sm font-bold text-text-primary truncate">
            {participant.name}
          </div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider truncate">
            {participant.teamName}
          </div>
        </>
      ) : (
        <div className="text-sm font-semibold text-text-secondary mt-0.5">
          Champion recorded
        </div>
      )}
    </div>
  </div>
);

const BracketMatchCard: React.FC<{
  fixture: TournamentFixture;
  participantMap: Record<string, TournamentParticipant>;
  emphasis?: "final";
  /** While league+knockout shows a live projection, hide "Ready" — those fixtures are not playable yet. */
  suppressReady?: boolean;
}> = ({ fixture, participantMap, emphasis, suppressReady = false }) => {
  const player1 = fixture.participant1Id
    ? participantMap[fixture.participant1Id]
    : undefined;
  const player2 = fixture.participant2Id
    ? participantMap[fixture.participant2Id]
    : undefined;

  const isCompleted = Boolean(fixture.matchId);
  const wouldBeReady = fixture.status === "READY" && !isCompleted;
  const isReady = wouldBeReady && !suppressReady;
  const isProjectionOnly = wouldBeReady && suppressReady;
  const isBye = fixture.status === "BYE";
  const isPending =
    !isCompleted && !isReady && !isBye && !isProjectionOnly;

  const cardClasses =
    emphasis === "final"
      ? "border-accent-2/30 bg-accent-2/10 shadow-[0_18px_36px_-28px_rgba(255,215,64,0.55)]"
      : isReady
        ? "border-accent-green/25 bg-accent-green/5 shadow-[0_0_16px_-6px_rgba(0,230,118,0.12)]"
        : isBye
          ? "border-dashed border-accent-purple/15 bg-accent-purple/5"
          : isPending || isProjectionOnly
            ? "border-glass-border bg-glass-light opacity-60"
            : "border-glass-border bg-glass-light";

  return (
    <div className={`rounded-[24px] border p-3 space-y-2 ${cardClasses}`}>
      {[player1, player2].map((player, index) => {
        const participantId =
          index === 0 ? fixture.participant1Id : fixture.participant2Id;
        const isWinner = participantId && fixture.winnerId === participantId;

        return (
          <div
            key={participantId || `slot-${index}`}
            className={`rounded-2xl border px-3 py-3 flex items-center justify-between gap-2 ${
              isWinner
                ? "border-accent-green/25 bg-accent-green/10 text-accent-green"
                : "border-glass-border bg-glass-light text-text-secondary"
            }`}
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">
                {player?.name ?? "TBD"}
              </div>
              <div className="text-[10px] uppercase tracking-wider truncate opacity-70">
                {player?.teamName ?? "Waiting"}
              </div>
            </div>
            {isWinner && <Trophy className="w-3.5 h-3.5 shrink-0" />}
          </div>
        );
      })}

      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="text-[10px] text-text-muted font-medium uppercase tracking-wider">
          {fixture.roundName}
        </div>
        <div
          className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
            isCompleted
              ? "bg-accent-green/10 text-accent-green border border-accent-green/15"
              : isReady
                ? "bg-accent-gold/10 text-accent-gold border border-accent-gold/15"
                : isProjectionOnly
                  ? "bg-accent-2/10 text-accent-2 border border-accent-2/20"
                  : isBye
                    ? "bg-accent-purple/10 text-accent-purple border border-accent-purple/15"
                    : "bg-glass-light text-text-muted border border-glass-border"
          }`}
        >
          {isCompleted && <CheckCircle2 className="w-2.5 h-2.5" />}
          {isReady && <Clock className="w-2.5 h-2.5" />}
          {isProjectionOnly && <Circle className="w-2.5 h-2.5" />}
          {isBye && <SkipForward className="w-2.5 h-2.5" />}
          {isPending && <Circle className="w-2.5 h-2.5" />}
          {isCompleted
            ? "Completed"
            : isReady
              ? "Ready"
              : isProjectionOnly
                ? "Projection"
                : isBye
                  ? "Bye"
                  : "Pending"}
        </div>
      </div>
    </div>
  );
};
