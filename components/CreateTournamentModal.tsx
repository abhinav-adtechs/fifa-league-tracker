import React, { useState } from "react";
import type { PlayerProfile, TournamentType } from "../types";
import {
  DEFAULT_TOURNAMENT_SETTINGS,
  getEffectiveGroupCount,
  TROPHY_IMAGES,
} from "../utils/tournaments";
import { buildTournamentPlanSummary } from "../utils/createTournamentPlan";
import {
  BarChart3,
  GitBranch,
  RefreshCcw,
  Users,
  X,
} from "lucide-react";

export interface CreateTournamentDraft {
  name: string;
  type: TournamentType;
  targetPlayerCount: number;
  trophyImage: string;
  entries: Array<{ profileId: string; teamName: string }>;
  guests: Array<{ name: string; teamName: string }>;
  settings: {
    matchesPerOpponent: number;
    matchDurationMinutes: number;
    bufferMinutes: number;
    qualifierCount: number;
    groupCount: number;
  };
}

const TYPE_OPTIONS: Array<{
  value: TournamentType;
  label: string;
  detail: string;
}> = [
  { value: "OPEN_LEAGUE", label: "Open League", detail: "No fixed schedule" },
  { value: "LEAGUE", label: "League", detail: "Round robin" },
  { value: "KNOCKOUT", label: "Knockout", detail: "Bracket only" },
  {
    value: "LEAGUE_KNOCKOUT",
    label: "League + KO",
    detail: "Table then bracket",
  },
];

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-xs font-medium text-text-secondary mb-1.5">
      {children}
    </span>
  );
}

function SectionCard({
  icon: Icon,
  iconClass,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card p-4 rounded-2xl space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 shrink-0 ${iconClass}`} />
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function PlanStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-glass-border bg-glass-light px-2.5 py-2">
      <div className="text-base font-bold text-text-primary font-mono leading-tight">
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-text-muted font-semibold mt-0.5">
        {label}
      </div>
    </div>
  );
}

export const CreateTournamentModal: React.FC<{
  playerPool: PlayerProfile[];
  onClose: () => void;
  onSubmit: (draft: CreateTournamentDraft) => Promise<void>;
}> = ({ playerPool, onClose, onSubmit }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<TournamentType>("LEAGUE");
  const [targetPlayerCount, setTargetPlayerCount] = useState(6);
  const [trophyIndex, setTrophyIndex] = useState(0);
  const [participantMode, setParticipantMode] = useState<"existing" | "guest">(
    "existing",
  );
  const [profileId, setProfileId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [entries, setEntries] = useState<
    Array<{ profileId: string; teamName: string }>
  >([]);
  const [guests, setGuests] = useState<
    Array<{ name: string; teamName: string }>
  >([]);
  const [matchesPerOpponent, setMatchesPerOpponent] = useState(1);
  const [qualifierCount, setQualifierCount] = useState(
    DEFAULT_TOURNAMENT_SETTINGS.qualifierCount,
  );
  const [groupCount, setGroupCount] = useState(
    DEFAULT_TOURNAMENT_SETTINGS.groupCount,
  );
  const [submitting, setSubmitting] = useState(false);

  const availableProfiles = playerPool.filter(
    (profile) => !entries.some((entry) => entry.profileId === profile.id),
  );
  const participantCount = entries.length + guests.length;
  const planningPlayerCount = Math.max(targetPlayerCount, participantCount);
  const selectedTrophy = TROPHY_IMAGES[trophyIndex % TROPHY_IMAGES.length];
  const planSummary = buildTournamentPlanSummary({
    type,
    playerCount: planningPlayerCount,
    matchesPerOpponent,
    qualifierCount,
    groupCount,
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    if (participantCount < 2) {
      alert("Add at least two players to create a tournament.");
      return;
    }

    setSubmitting(true);
    await onSubmit({
      name,
      type,
      targetPlayerCount,
      trophyImage: selectedTrophy.image,
      entries,
      guests,
      settings: {
        matchesPerOpponent,
        matchDurationMinutes: DEFAULT_TOURNAMENT_SETTINGS.matchDurationMinutes,
        bufferMinutes: DEFAULT_TOURNAMENT_SETTINGS.bufferMinutes,
        qualifierCount:
          type === "LEAGUE_KNOCKOUT"
            ? Math.max(
                getEffectiveGroupCount(participantCount, groupCount),
                Math.min(qualifierCount, participantCount || qualifierCount),
              )
            : Math.max(
                2,
                Math.min(qualifierCount, participantCount || qualifierCount),
              ),
        groupCount:
          type === "LEAGUE_KNOCKOUT"
            ? getEffectiveGroupCount(participantCount, groupCount)
            : 1,
      },
    });
    setSubmitting(false);
  };

  return (
    <div
      className="modal-overlay"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="modal-content modal-content--scrollable"
        role="dialog"
        aria-labelledby="create-tournament-title"
      >
        <div className="shrink-0 relative border-b border-glass-border px-4 pt-3 pb-3 pr-12">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2.5 right-2.5 p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-glass-light transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-[72px] rounded-2xl border border-glass-border bg-gradient-to-b from-glass-light to-surface-2/50 px-2 py-2 flex flex-col items-center gap-1.5">
              <img
                src={selectedTrophy.image}
                alt=""
                className="w-11 h-14 object-contain drop-shadow-md"
              />
              <button
                type="button"
                onClick={() =>
                  setTrophyIndex(
                    (current) => (current + 1) % TROPHY_IMAGES.length,
                  )
                }
                className="btn-ghost w-full py-1 text-[10px] flex items-center justify-center gap-1"
              >
                <RefreshCcw className="w-3 h-3 shrink-0" />
                Cup
              </button>
            </div>
            <div className="min-w-0">
              <h2
                id="create-tournament-title"
                className="text-base font-bold text-text-primary leading-snug"
              >
                Create tournament
              </h2>
              <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                Format, roster, and a quick preview of fixtures.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="min-w-0">
          <div className="px-4 py-4 space-y-4">
            <div>
              <FormLabel>Tournament name</FormLabel>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="input-field w-full text-sm"
                placeholder="Summer Cup"
                autoComplete="off"
              />
            </div>

            <div>
              <FormLabel>Type</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={`rounded-xl border px-2.5 py-2.5 text-left transition-all ${
                      type === option.value
                        ? "border-accent-green/35 bg-accent-green/10 shadow-[0_0_0_1px_rgba(0,230,118,0.12)]"
                        : "border-glass-border bg-glass-light hover:border-glass-border-hover"
                    }`}
                  >
                    <div className="text-xs font-semibold text-text-primary leading-tight">
                      {option.label}
                    </div>
                    <div className="text-[11px] text-text-muted mt-1 leading-snug">
                      {option.detail}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
              <SectionCard
                icon={GitBranch}
                iconClass="text-accent-green"
                title="Format"
              >
                <p className="text-xs text-text-secondary leading-relaxed">
                  League rounds, groups, and knockout settings used to build
                  fixtures.
                </p>
                {type === "OPEN_LEAGUE" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <FormLabel>Players (target)</FormLabel>
                      <input
                        type="number"
                        min={2}
                        value={targetPlayerCount}
                        onChange={(event) =>
                          setTargetPlayerCount(
                            Math.max(2, Number(event.target.value) || 2),
                          )
                        }
                        className="input-field w-full text-sm"
                      />
                    </div>
                    <div className="rounded-xl border border-glass-border px-3 py-2.5 text-xs text-text-secondary leading-relaxed flex items-center">
                      Open leagues do not pre-generate fixtures. Add players and
                      record matches as you play.
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <FormLabel>Players (target)</FormLabel>
                      <input
                        type="number"
                        min={2}
                        value={targetPlayerCount}
                        onChange={(event) =>
                          setTargetPlayerCount(
                            Math.max(2, Number(event.target.value) || 2),
                          )
                        }
                        className="input-field w-full text-sm"
                      />
                    </div>
                    {(type === "LEAGUE" || type === "LEAGUE_KNOCKOUT") && (
                      <div>
                        <FormLabel>Matches per opponent</FormLabel>
                        <input
                          type="number"
                          min={1}
                          value={matchesPerOpponent}
                          onChange={(event) =>
                            setMatchesPerOpponent(
                              Math.max(1, Number(event.target.value) || 1),
                            )
                          }
                          className="input-field w-full text-sm"
                        />
                      </div>
                    )}
                    {type === "LEAGUE_KNOCKOUT" && (
                      <>
                        <div>
                          <FormLabel>League groups</FormLabel>
                          <input
                            type="number"
                            min={1}
                            max={Math.max(
                              1,
                              Math.floor(planningPlayerCount / 2),
                            )}
                            value={groupCount}
                            onChange={(event) =>
                              setGroupCount(
                                Math.max(1, Number(event.target.value) || 1),
                              )
                            }
                            className="input-field w-full text-sm"
                          />
                        </div>
                        <div>
                          <FormLabel>Qualifiers to knockout</FormLabel>
                          <input
                            type="number"
                            min={Math.max(
                              2,
                              getEffectiveGroupCount(
                                planningPlayerCount,
                                groupCount,
                              ),
                            )}
                            value={qualifierCount}
                            onChange={(event) =>
                              setQualifierCount(
                                Math.max(2, Number(event.target.value) || 2),
                              )
                            }
                            className="input-field w-full text-sm"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                icon={BarChart3}
                iconClass="text-accent-2"
                title="Preview"
              >
                <p className="text-sm font-semibold text-text-primary leading-snug">
                  {planSummary.headline}
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {planSummary.breakdown}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <PlanStat
                    label="League"
                    value={String(planSummary.leagueMatches)}
                  />
                  <PlanStat
                    label="Knockout"
                    value={String(planSummary.knockoutMatches)}
                  />
                  <PlanStat
                    label="Total games"
                    value={String(planSummary.totalMatches)}
                  />
                  <PlanStat
                    label="Players"
                    value={String(planningPlayerCount)}
                  />
                </div>
              </SectionCard>
            </div>

            <SectionCard
              icon={Users}
              iconClass="text-accent-purple"
              title="Participants"
            >
              <p className="text-xs text-text-secondary leading-relaxed">
                Each person needs a team name for fixtures and the bracket.
              </p>
              <div className="flex rounded-xl border border-glass-border bg-glass-light p-0.5 gap-0.5">
                {[
                  { id: "existing" as const, label: "From pool" },
                  { id: "guest" as const, label: "Guest" },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setParticipantMode(option.id)}
                    className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                      participantMode === option.id
                        ? "bg-accent-purple/15 text-accent-purple border border-accent-purple/20"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1 min-w-0">
                  <FormLabel>
                    {participantMode === "existing" ? "Player" : "Guest name"}
                  </FormLabel>
                  {participantMode === "existing" ? (
                    <select
                      value={profileId}
                      onChange={(event) => setProfileId(event.target.value)}
                      className="select-field w-full text-sm"
                    >
                      <option value="">Select…</option>
                      {availableProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={guestName}
                      onChange={(event) => setGuestName(event.target.value)}
                      className="input-field w-full text-sm"
                      placeholder="Name"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <FormLabel>Team</FormLabel>
                  <input
                    value={teamName}
                    onChange={(event) => setTeamName(event.target.value)}
                    className="input-field w-full text-sm"
                    placeholder="Team name"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!teamName.trim()) return;
                    if (participantMode === "existing") {
                      if (!profileId) return;
                      setEntries([
                        ...entries,
                        { profileId, teamName: teamName.trim() },
                      ]);
                      setProfileId("");
                    } else {
                      if (!guestName.trim()) return;
                      setGuests([
                        ...guests,
                        { name: guestName.trim(), teamName: teamName.trim() },
                      ]);
                      setGuestName("");
                    }
                    setTeamName("");
                  }}
                  disabled={
                    participantMode === "existing"
                      ? !profileId || !teamName.trim()
                      : !guestName.trim() || !teamName.trim()
                  }
                  className="btn-primary py-2.5 px-4 text-sm shrink-0 w-full sm:w-auto disabled:opacity-30 disabled:cursor-not-allowed rounded-xl"
                >
                  Add
                </button>
              </div>

              <div className="border-t border-glass-border pt-3 mt-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-text-primary">
                    Roster
                  </span>
                  <span className="text-[11px] text-text-muted font-medium tabular-nums">
                    {participantCount} / {targetPlayerCount}
                  </span>
                </div>
                {participantCount === 0 ? (
                  <p className="text-xs text-text-muted py-2">
                    No one added yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-glass-border">
                    {entries.map((entry) => {
                      const profile = playerPool.find(
                        (item) => item.id === entry.profileId,
                      );
                      return (
                        <li
                          key={entry.profileId}
                          className="flex items-center justify-between gap-3 py-2.5 first:pt-2"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-text-primary truncate">
                              {profile?.name ?? "Unknown"}
                            </div>
                            <div className="text-xs text-accent-blue truncate">
                              {entry.teamName}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setEntries(
                                entries.filter(
                                  (item) => item.profileId !== entry.profileId,
                                ),
                              )
                            }
                            className="text-text-muted hover:text-accent-red p-1.5 rounded-lg shrink-0 transition-colors"
                            aria-label="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </li>
                      );
                    })}
                    {guests.map((guest, index) => (
                      <li
                        key={`${guest.name}-${index}`}
                        className="flex items-center justify-between gap-3 py-2.5 first:pt-2"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-text-primary truncate">
                            {guest.name}
                          </div>
                          <div className="text-xs text-accent-blue truncate">
                            {guest.teamName}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setGuests(guests.filter((_, i) => i !== index))
                          }
                          className="text-text-muted hover:text-accent-red p-1.5 rounded-lg shrink-0 transition-colors"
                          aria-label="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </SectionCard>
          </div>

          <div className="flex gap-2 p-4 border-t border-glass-border">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 py-2.5 text-sm rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                !name.trim() ||
                participantCount < 2 ||
                participantCount !== targetPlayerCount
              }
              className="btn-primary flex-1 py-2.5 text-sm rounded-xl disabled:opacity-30"
            >
              {submitting ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
