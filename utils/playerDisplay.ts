import type { Player } from "../types";

/** Default placeholder from `profileToParticipant` — hide in UI as "unset". */
const PLACEHOLDER_TEAMS = new Set(["tbd fc"]);

export function getDisplayTeamName(teamName?: string): string | undefined {
  const t = teamName?.trim();
  if (!t) return undefined;
  if (PLACEHOLDER_TEAMS.has(t.toLowerCase())) return undefined;
  return t;
}

export function playerWithTeamLabel(player: Pick<Player, "name" | "teamName">): string {
  const team = getDisplayTeamName(player.teamName);
  return team ? `${player.name} · ${team}` : player.name;
}
