import { useMemo } from "react";
import { TeamList } from "../components/TeamList";
import { useTeams } from "../hooks/useTeams";
import { useSeasonStats } from "../hooks/useSeasonStats";

export function TeamsPage() {
  const { teams, loading: teamsLoading, error: teamsError } = useTeams();
  const { stats, loading: statsLoading, error: statsError } = useSeasonStats();

  const allTimeRecords = useMemo(() => {
    const map: Record<number, { wins: number; losses: number }> = {};
    for (const s of stats) {
      if (!map[s.rosterId]) map[s.rosterId] = { wins: 0, losses: 0 };
      map[s.rosterId].wins += s.wins;
      map[s.rosterId].losses += s.losses;
    }
    return map;
  }, [stats]);

  if (teamsLoading || statsLoading) return <div>Loading teams…</div>;
  if (teamsError) return <div style={{ color: "crimson" }}>Error: {teamsError}</div>;
  if (statsError) return <div style={{ color: "crimson" }}>Error: {statsError}</div>;

  return (
    <div>
      <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 900 }}>The Squads</h1>
      <p style={{ margin: "0 0 20px", color: "var(--cr-text-muted)", fontSize: 15 }}>
        Click a team to see their full history.
      </p>

      <TeamList teams={teams} allTimeRecords={allTimeRecords} />
    </div>
  );
}
