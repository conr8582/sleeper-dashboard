// src/lib/sleeper.ts — shared foundation for Sleeper API interactions

export const LEAGUE_ID = "1257481742223163392";
export const START_SEASON = 2023;

// ─── Types ────────────────────────────────────────────────────────────────────

export type SleeperUser = {
  user_id: string;
  display_name: string;
  avatar?: string | null;
  metadata?: {
    team_name?: string;
  };
};

export type SleeperRosterSettings = {
  wins: number;
  losses: number;
  ties: number;
  fpts: number;
  fpts_decimal?: number;
  fpts_against?: number;
  fpts_against_decimal?: number;
};

export type SleeperRoster = {
  roster_id: number;
  owner_id: string | null;
  settings: SleeperRosterSettings;
  metadata?: {
    team_name?: string;
    avatar?: string | null;
  };
};

export type SleeperLeague = {
  league_id: string;
  season: string; // "2025"
  previous_league_id: string | null;
  settings: {
    playoff_week_start: number;
  };
};

export type SleeperMatchup = {
  matchup_id: number | null;
  roster_id: number;
  points: number;
};

export type TeamInfo = {
  rosterId: number;
  teamName: string;
  ownerName: string;
  avatarId?: string | null;
};

// ─── Utility functions ────────────────────────────────────────────────────────

export function sleeperAvatarUrl(avatarId: string): string {
  return `https://sleepercdn.com/avatars/${avatarId}`;
}

export function slugifyTeamName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status}) for ${url}`);
  return res.json();
}

export async function getLeagueHistoryFromCurrent(
  currentLeagueId: string,
  startSeason: number
): Promise<{ leagueId: string; season: number }[]> {
  const out: { leagueId: string; season: number }[] = [];

  let leagueId: string | null = currentLeagueId;

  while (leagueId) {
    const fetchedLeague: SleeperLeague = await fetchJSON<SleeperLeague>(
      `https://api.sleeper.app/v1/league/${leagueId}`
    );

    const seasonNum = Number(fetchedLeague.season);
    if (!Number.isFinite(seasonNum)) break;
    if (seasonNum < startSeason) break;

    out.push({ leagueId: fetchedLeague.league_id, season: seasonNum });
    leagueId = fetchedLeague.previous_league_id;
  }

  return out.sort((a, b) => a.season - b.season);
}
