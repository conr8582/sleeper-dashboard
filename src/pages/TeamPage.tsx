import { Link, useParams } from "react-router-dom";
import { useTeams } from "../hooks/useTeams";
import { useSeasonStats } from "../hooks/useSeasonStats";
import { sleeperAvatarUrl } from "../lib/sleeper";

function parseRosterId(teamKey: string | undefined): number | null {
  if (!teamKey) return null;
  // supports: "3-the-baker-mayfields" or just "3"
  const firstPart = teamKey.split("-")[0];
  const id = Number(firstPart);
  return Number.isFinite(id) ? id : null;
}

export function TeamPage() {
  const { teamKey } = useParams();
  const rosterId = parseRosterId(teamKey);

  const { teams, loading: teamsLoading, error: teamsError } = useTeams();
  const { stats, loading: statsLoading, error: statsError } = useSeasonStats();

  if (teamsLoading || statsLoading) return <div>Loading team…</div>;
  if (teamsError) return <div style={{ color: "crimson" }}>Error: {teamsError}</div>;
  if (statsError) return <div style={{ color: "crimson" }}>Error: {statsError}</div>;
  if (rosterId == null) return <div>Invalid team link.</div>;

  const team = teams.find((t) => t.rosterId === rosterId);
  if (!team) return <div>Team not found.</div>;

  const teamStats = stats
    .filter((s) => s.rosterId === rosterId)
    .sort((a, b) => a.season - b.season);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            overflow: "hidden",
            background: "rgba(0,0,0,0.06)",
            display: "grid",
            placeItems: "center",
            flex: "0 0 auto",
          }}
          aria-hidden
        >
          {team.avatarId ? (
            <img
              src={sleeperAvatarUrl(team.avatarId)}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontWeight: 900, fontSize: 24, opacity: 0.7 }}>
              {team.teamName.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, lineHeight: 1.1 }}>{team.teamName}</h1>
          <div style={{ marginTop: 6, opacity: 0.7 }}>Owner: {team.ownerName}</div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <Link to="/teams" style={{ textDecoration: "none" }}>
          ← Back to Teams
        </Link>
      </div>

      {teamStats.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h2 style={{ margin: "0 0 10px 0" }}>Season History</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(0,0,0,0.1)" }}>
                  <th style={{ textAlign: "left", padding: "6px 12px 6px 0" }}>Season</th>
                  <th style={{ textAlign: "center", padding: "6px 12px" }}>W</th>
                  <th style={{ textAlign: "center", padding: "6px 12px" }}>L</th>
                  <th style={{ textAlign: "center", padding: "6px 12px" }}>T</th>
                  <th style={{ textAlign: "right", padding: "6px 12px" }}>PF</th>
                  <th style={{ textAlign: "right", padding: "6px 0 6px 12px" }}>PA</th>
                </tr>
              </thead>
              <tbody>
                {teamStats.map((s, i) => (
                  <tr
                    key={s.season}
                    style={{
                      background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.02)",
                      borderBottom: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    <td style={{ padding: "6px 12px 6px 0", fontWeight: 600 }}>{s.season}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
