import type { CSSProperties } from "react";
import type { TournamentFixture } from "../types";

/** Blue / red only — alternates for contrast between adjacent groups. */
const GROUP_ACCENT_HEX = [
  "#448AFF",
  "#FF5252",
  "#1E88E5",
  "#E53935",
  "#64B5F6",
  "#EF5350",
  "#3949AB",
  "#C62828",
] as const;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbaFromHex(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Sorted unique league group names from fixtures (stable palette order). */
export function sortedLeagueGroupNames(
  fixtures: TournamentFixture[],
): string[] {
  const names = new Set<string>();
  for (const f of fixtures) {
    if (f.stage === "LEAGUE" && f.groupName?.trim()) {
      names.add(f.groupName.trim());
    }
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

function groupIndex(
  fixture: TournamentFixture,
  sortedGroups: string[],
): number {
  const name = fixture.groupName?.trim();
  if (!name) return -1;
  return sortedGroups.indexOf(name);
}

/** Accent hex for a league fixture when multi-group coloring applies. */
export function leagueGroupAccentHex(
  fixture: TournamentFixture,
  sortedGroups: string[],
): string | undefined {
  if (sortedGroups.length < 2 || fixture.stage !== "LEAGUE") return undefined;
  const idx = groupIndex(fixture, sortedGroups);
  if (idx < 0) return undefined;
  return GROUP_ACCENT_HEX[idx % GROUP_ACCENT_HEX.length];
}

/** Left accent stripe for league rows when the schedule has multiple groups. */
export function leagueGroupFixtureAccentStyle(
  fixture: TournamentFixture,
  sortedGroups: string[],
): CSSProperties | undefined {
  const hex = leagueGroupAccentHex(fixture, sortedGroups);
  if (!hex) return undefined;
  return {
    borderLeftWidth: 4,
    borderLeftStyle: "solid",
    borderLeftColor: hex,
  };
}

/** Ready-state card: border, fill, glow using group hue (multi-group league). */
export function leagueGroupReadyCardStyle(hex: string): CSSProperties {
  return {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: rgbaFromHex(hex, 0.3),
    borderLeftWidth: 4,
    borderLeftStyle: "solid",
    borderLeftColor: hex,
    backgroundColor: rgbaFromHex(hex, 0.05),
    boxShadow: `0 0 12px -4px ${rgbaFromHex(hex, 0.15)}`,
  };
}

/** Completed badge using group hue instead of default green. */
export function leagueGroupCompletedBadgeStyle(hex: string): CSSProperties {
  return {
    color: hex,
    backgroundColor: rgbaFromHex(hex, 0.1),
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: rgbaFromHex(hex, 0.15),
  };
}
