import { useEffect, useState } from "react";
import { fetchJSON, type SleeperMatchup } from "../lib/sleeper";

export function useWeekMatchups(leagueId: string | null, week: number) {
  const [matchups, setMatchups] = useState<SleeperMatchup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leagueId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchJSON<SleeperMatchup[]>(
          `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`
        );
        if (!cancelled) setMatchups(data);
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
  }, [leagueId, week]);

  return { matchups, loading, error };
}
