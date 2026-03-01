import { Link, useParams } from "react-router-dom";
import { useTeams } from "../hooks/useTeams";
import { useSeasonStats } from "../hooks/useSeasonStats";
import { sleeperAvatarUrl } from "../lib/sleeper";

function parseRosterId(teamKey: string | undefined): number | null {
  if (!teamKey) return null;
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

  // Compute season ranks (sort all rosters in each season by wins → PF)
  const allSeasons = [...new Set(stats.map((s) => s.season))];
  const rankBySeason: Record<number, number> = {};
  for (const season of allSeasons) {
    const seasonRows = stats
      .filter((s) => s.season === season)
      .sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor);
    const idx = seasonRows.findIndex((s) => s.rosterId === rosterId);
    if (idx !== -1) rankBySeason[season] = idx + 1;
  }

  // All-time aggregates
  const totalWins = teamStats.reduce((sum, s) => sum + s.wins, 0);
  const totalLosses = teamStats.reduce((sum, s) => sum + s.losses, 0);
  const totalGames = totalWins + totalLosses;
  const winPct = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;
  const totalPF = teamStats.reduce((sum, s) => sum + s.pointsFor, 0);

  const statCards = [
    { label: "ALL-TIME RECORD", value: `${totalWins}-${totalLosses}` },
    { label: "WIN %", value: `${winPct.toFixed(1)}%` },
    { label: "TOTAL POINTS", value: totalPF.toFixed(0) },
    { label: "CHAMPIONSHIPS", value: "—" },
  ];

  return (
    <div>
      <Link
        to="/teams"
        style={{
          display: "inline-block",
          marginBottom: 20,
          fontSize: 14,
          fontWeight: 600,
          color: "var(--cr-blue)",
          textDecoration: "none",
        }}
      >
        ← Back to Teams
      </Link>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
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
            <span style={{ fontWeight: 900, fontSize: 24 }}>
              {team.teamName.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, lineHeight: 1.1 }}>
            {team.teamName}
          </h1>
          <div style={{ marginTop: 5, color: "var(--cr-text-muted)", fontSize: 14 }}>
            Owner: {team.ownerName}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 28,
        }}
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              padding: "16px 18px",
              background: "var(--cr-surface)",
              border: "1px solid var(--cr-border)",
              borderRadius: 12,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "var(--cr-text-muted)",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              {card.label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--cr-red)" }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Season History */}
      {teamStats.length > 0 && (
        <div>
          <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 800 }}>Season History</h2>
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
                  <th style={{ textAlign: "left", padding: "8px 14px 8px 0" }}>Season</th>
                  <th style={{ textAlign: "center", padding: "8px 12px" }}>W</th>
                  <th style={{ textAlign: "center", padding: "8px 12px" }}>L</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>PF</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>PA</th>
                  <th style={{ textAlign: "center", padding: "8px 0 8px 12px" }}>Rank</th>
                </tr>
              </thead>
              <tbody>
                {teamStats.map((s, i) => (
                  <tr
                    key={s.season}
                    style={{
                      background: i % 2 === 0 ? "transparent" : "var(--cr-surface)",
                      borderBottom: "1px solid var(--cr-border)",
                    }}
                  >
                    <td style={{ padding: "10px 14px 10px 0", fontWeight: 700 }}>{s.season}</td>
                    <td style={{ textAlign: "center", padding: "10px 12px", color: "var(--cr-blue)", fontWeight: 700 }}>
                      {s.wins}
                    </td>
                    <td style={{ textAlign: "center", padding: "10px 12px" }}>{s.losses}</td>
                    <td style={{ textAlign: "right", padding: "10px 12px" }}>
                      {s.pointsFor.toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right", padding: "10px 12px" }}>
                      {s.pointsAgainst.toFixed(2)}
                    </td>
                    <td style={{ textAlign: "center", padding: "10px 0 10px 12px", fontWeight: 600 }}>
                      {rankBySeason[s.season] ?? "—"}
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
