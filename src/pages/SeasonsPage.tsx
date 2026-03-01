import { useSeasonStats } from "../hooks/useSeasonStats";
import { useTeams } from "../hooks/useTeams";

export function SeasonsPage() {
  const { stats, loading: statsLoading, error: statsError } = useSeasonStats();
  const { teams, loading: teamsLoading, error: teamsError } = useTeams();

  if (statsLoading || teamsLoading) return <div>Loading seasons…</div>;
  if (statsError) return <div style={{ color: "crimson" }}>Error: {statsError}</div>;
  if (teamsError) return <div style={{ color: "crimson" }}>Error: {teamsError}</div>;

  const seasons = [...new Set(stats.map((s) => s.season))].sort((a, b) => a - b);

  return (
    <div style={{ marginTop: 16 }}>
      <h1 style={{ margin: 0 }}>Season Stats</h1>

      {seasons.map((season) => {
        const seasonStats = stats
          .filter((s) => s.season === season)
          .sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor);

        return (
          <div key={season} style={{ marginTop: 28 }}>
            <h2 style={{ margin: "0 0 10px 0" }}>{season}</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(0,0,0,0.1)" }}>
                    <th style={{ textAlign: "left", padding: "6px 12px 6px 0" }}>Team</th>
                    <th style={{ textAlign: "center", padding: "6px 12px" }}>W</th>
                    <th style={{ textAlign: "center", padding: "6px 12px" }}>L</th>
                    <th style={{ textAlign: "center", padding: "6px 12px" }}>T</th>
                    <th style={{ textAlign: "right", padding: "6px 12px" }}>PF</th>
                    <th style={{ textAlign: "right", padding: "6px 0 6px 12px" }}>PA</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonStats.map((s, i) => {
                    const team = teams.find((t) => t.rosterId === s.rosterId);
                    const name = team?.teamName ?? `Roster ${s.rosterId}`;
                    return (
                      <tr
                        key={s.rosterId}
                        style={{
                          background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.02)",
                          borderBottom: "1px solid rgba(0,0,0,0.05)",
                        }}
                      >
                        <td style={{ padding: "6px 12px 6px 0" }}>{name}</td>
                        <td style={{ textAlign: "center", padding: "6px 12px" }}>{s.wins}</td>
                        <td style={{ textAlign: "center", padding: "6px 12px" }}>{s.losses}</td>
                        <td style={{ textAlign: "center", padding: "6px 12px" }}>{s.ties}</td>
                        <td style={{ textAlign: "right", padding: "6px 12px" }}>
                          {s.pointsFor.toFixed(2)}
                        </td>
                        <td style={{ textAlign: "right", padding: "6px 0 6px 12px" }}>
                          {s.pointsAgainst.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
