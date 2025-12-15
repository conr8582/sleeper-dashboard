import { TeamList } from "../components/TeamList";
import { useTeams } from "../hooks/useTeams";

export function TeamsPage() {
  const { teams, loading, error } = useTeams();

  if (loading) return <div>Loading teams…</div>;
  if (error) return <div style={{ color: "crimson" }}>Error: {error}</div>;

  return (
    <div style={{ marginTop: 16 }}>
      <TeamList teams={teams} />
    </div>
  );
}
