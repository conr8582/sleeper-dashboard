import { useEffect, useState } from "react";
import { fetchJSON, type SleeperMatchup } from "../lib/sleeper";

export type WeeklyMatchups = Record<number, SleeperMatchup[]>;

export function useSeasonMatchups(leagueId: string | null) {
  const [weeklyMatchups, setWeeklyMatchups] = useState<WeeklyMatchups>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leagueId) {
      setWeeklyMatchups({});
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const result: WeeklyMatchups = {};

      try {
        for (let week = 1; week <= 18; week++) {
          const matchups = await fetchJSON<SleeperMatchup[]>(
            `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`
          );
          if (cancelled) return;
          if (!matchups || matchups.length === 0) break;
          result[week] = matchups;
        }
        if (!cancelled) setWeeklyMatchups(result);
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
  }, [leagueId]);

  return { weeklyMatchups, loading, error };
}
