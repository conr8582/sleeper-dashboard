import { useEffect, useState } from "react";
import {
  LEAGUE_ID,
  START_SEASON,
  fetchJSON,
  getLeagueHistoryFromCurrent,
  type SleeperRoster,
} from "../lib/sleeper";

export type SeasonRosterStats = {
  season: number;
  leagueId: string;
  rosterId: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
};

export function useSeasonStats() {
  const [stats, setStats] = useState<SeasonRosterStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const leagues = await getLeagueHistoryFromCurrent(LEAGUE_ID, START_SEASON);
        const allStats: SeasonRosterStats[] = [];

        for (const { leagueId, season } of leagues) {
          const rosters = await fetchJSON<SleeperRoster[]>(
            `https://api.sleeper.app/v1/league/${leagueId}/rosters`
          );

          for (const roster of rosters) {
            const s = roster.settings;
            allStats.push({
              season,
              leagueId,
              rosterId: roster.roster_id,
              wins: s.wins ?? 0,
              losses: s.losses ?? 0,
              ties: s.ties ?? 0,
              pointsFor: (s.fpts ?? 0) + (s.fpts_decimal ?? 0) / 100,
              pointsAgainst: (s.fpts_against ?? 0) + (s.fpts_against_decimal ?? 0) / 100,
            });
          }
        }

        if (!cancelled) setStats(allStats);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, loading, error };
}
