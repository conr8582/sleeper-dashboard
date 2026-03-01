import { useSeasonStats } from "../hooks/useSeasonStats";
import { useTeams } from "../hooks/useTeams";
import { sleeperAvatarUrl } from "../lib/sleeper";

export function SeasonsPage() {
  const { stats, loading: statsLoading, error: statsError } = useSeasonStats();
  const { teams, loading: teamsLoading, error: teamsError } = useTeams();

  if (statsLoading || teamsLoading) return <div>Loading seasons…</div>;
  if (statsError) return <div style={{ color: "crimson" }}>Error: {statsError}</div>;
  if (teamsError) return <div style={{ color: "crimson" }}>Error: {teamsError}</div>;

  const seasons = [...new Set(stats.map((s) => s.season))].sort((a, b) => b - a);

  return (
    <div>
      <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 900 }}>Season Stats</h1>
      <p style={{ margin: "0 0 24px", color: "var(--cr-text-muted)", fontSize: 15 }}>
        Full standings for every season.
      </p>

      {seasons.map((season) => {
        const seasonStats = stats
          .filter((s) => s.season === season)
          .sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor);

        return (
          <div key={season} style={{ marginBottom: 36 }}>
            <h2
              style={{
                margin: "0 0 12px",
                fontSize: 28,
                fontWeight: 900,
                color: "var(--cr-red)",
              }}
            >
              {season}
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid var(--cr-border)",
                      color: "var(--cr-text-muted)",
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    <th style={{ textAlign: "center", padding: "8px 10px 8px 0", width: 36 }}>#</th>
                    <th style={{ textAlign: "left", padding: "8px 14px" }}>Team</th>
                    <th style={{ textAlign: "center", padding: "8px 12px" }}>W</th>
                    <th style={{ textAlign: "center", padding: "8px 12px" }}>L</th>
                    <th style={{ textAlign: "right", padding: "8px 12px" }}>PF</th>
                    <th style={{ textAlign: "right", padding: "8px 0 8px 12px" }}>PA</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonStats.map((s, i) => {
                    const team = teams.find((t) => t.rosterId === s.rosterId);
                    const name = team?.teamName ?? `Roster ${s.rosterId}`;
                    const avatarId = team?.avatarId;

                    return (
                      <tr
                        key={s.rosterId}
                        style={{
                          background: i % 2 === 0 ? "transparent" : "var(--cr-surface)",
                          borderBottom: "1px solid var(--cr-border)",
                        }}
                      >
                        <td
                          style={{
                            textAlign: "center",
                            padding: "10px 10px 10px 0",
                            fontWeight: 700,
                            color: "var(--cr-text-muted)",
                          }}
                        >
                          {i + 1}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                overflow: "hidden",
                                background: "rgba(0,0,0,0.06)",
                                display: "grid",
                                placeItems: "center",
                                flexShrink: 0,
                              }}
                              aria-hidden
                            >
                              {avatarId ? (
                                <img
                                  src={sleeperAvatarUrl(avatarId)}
                                  alt=""
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  loading="lazy"
                                />
                              ) : (
                                <span style={{ fontWeight: 700, fontSize: 11 }}>
                                  {name.slice(0, 1).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span style={{ fontWeight: 600 }}>{name}</span>
                          </div>
                        </td>
                        <td
                          style={{
                            textAlign: "center",
                            padding: "10px 12px",
                            color: "var(--cr-blue)",
                            fontWeight: 700,
                          }}
                        >
                          {s.wins}
                        </td>
                        <td style={{ textAlign: "center", padding: "10px 12px" }}>{s.losses}</td>
                        <td style={{ textAlign: "right", padding: "10px 12px" }}>
                          {s.pointsFor.toFixed(2)}
                        </td>
                        <td style={{ textAlign: "right", padding: "10px 0 10px 12px" }}>
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
