import { TeamList } from "../components/TeamList";
import { useTeams } from "../hooks/useTeams";

export function TeamsPage() {
  const { teams, loading, error } = useTeams();

  if (loading) return <div>Loading teams…</div>;
  if (error) return <div style={{ color: "crimson" }}>Error: {error}</div>;

  return (
    <div style={{ marginTop: 16 }}>
      <h1 style={{ marginTop: 0, marginBottom: 8 }}>Teams</h1>
      <div style={{ opacity: 0.7, marginBottom: 12 }}>
        Click a team to view details.
      </div>

      <TeamList teams={teams} />
    </div>
  );
}
