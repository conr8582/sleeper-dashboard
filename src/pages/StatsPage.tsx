import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useSeasonStats } from "../hooks/useSeasonStats";
import { useTeams } from "../hooks/useTeams";
import { useSeasonMatchups } from "../hooks/useSeasonMatchups";
import type { SleeperMatchup } from "../lib/sleeper";

// Exact hex values from index.css design tokens
const CR_RED = "#dc2626";
const CR_BLUE = "#2563eb";
const CR_TEXT_MUTED = "rgba(17, 24, 39, 0.55)";

const TEAM_COLORS = [
  "#e63946", "#457b9d", "#2a9d8f", "#f4a261", "#7209b7",
  "#06d6a0", "#118ab2", "#e9c46a", "#ef476f", "#264653",
];

const selectStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid var(--cr-border)",
  fontSize: 14,
  background: "#fff",
  color: "var(--cr-text)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--cr-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const cardStyle: React.CSSProperties = {
  background: "var(--cr-surface)",
  border: "1px solid var(--cr-border)",
  borderRadius: 12,
  padding: 20,
};

function LoadingBox() {
  return (
    <div
      style={{
        height: 260,
        display: "grid",
        placeItems: "center",
        color: "var(--cr-text-muted)",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      Loading…
    </div>
  );
}

export function StatsPage() {
  const { stats, loading: statsLoading } = useSeasonStats();
  const { teams, loading: teamsLoading } = useTeams();

  // Available seasons, newest first
  const seasons = useMemo(() => {
    return [...new Set(stats.map((r) => r.season))].sort((a, b) => b - a);
  }, [stats]);

  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const activeSeason = selectedSeason ?? seasons[0] ?? null;
  const activeTeamId = selectedTeamId ?? teams[0]?.rosterId ?? null;

  // leagueId for the active season (used by useSeasonMatchups)
  const seasonLeagueId = useMemo(() => {
    if (!activeSeason) return null;
    return stats.find((s) => s.season === activeSeason)?.leagueId ?? null;
  }, [stats, activeSeason]);

  const { weeklyMatchups, loading: matchupsLoading } = useSeasonMatchups(seasonLeagueId);

  // Lookup: rosterId → teamName
  const teamNameMap = useMemo(() => {
    const m = new Map<number, string>();
    teams.forEach((t) => m.set(t.rosterId, t.teamName));
    return m;
  }, [teams]);

  // ── Chart 1: Points Per Week ──────────────────────────────────────────────
  const pointsPerWeekData = useMemo(() => {
    const weeks = Object.keys(weeklyMatchups).map(Number).sort((a, b) => a - b);
    return weeks.map((week) => {
      const matchups = weeklyMatchups[week];
      const teamMatchup = matchups.find((m) => m.roster_id === activeTeamId);
      const avg =
        matchups.reduce((sum, m) => sum + (m.points ?? 0), 0) / matchups.length;
      return {
        week,
        team: +(teamMatchup?.points ?? 0).toFixed(2),
        avg: +avg.toFixed(2),
      };
    });
  }, [weeklyMatchups, activeTeamId]);

  // ── Chart 2: Standings Race ───────────────────────────────────────────────
  const standingsRaceData = useMemo(() => {
    const weeks = Object.keys(weeklyMatchups).map(Number).sort((a, b) => a - b);
    if (weeks.length === 0) return [];

    const cumStats: Record<number, { wins: number; pf: number }> = {};

    return weeks.map((week) => {
      const matchups = weeklyMatchups[week];

      // Accumulate PF for every team
      for (const m of matchups) {
        if (!cumStats[m.roster_id]) cumStats[m.roster_id] = { wins: 0, pf: 0 };
        cumStats[m.roster_id].pf += m.points ?? 0;
      }

      // Determine wins from head-to-head pairs
      const groups: Record<number, SleeperMatchup[]> = {};
      for (const m of matchups) {
        if (m.matchup_id === null) continue;
        if (!groups[m.matchup_id]) groups[m.matchup_id] = [];
        groups[m.matchup_id].push(m);
      }
      for (const pair of Object.values(groups)) {
        if (pair.length === 2) {
          const winner =
            (pair[0].points ?? 0) >= (pair[1].points ?? 0) ? pair[0] : pair[1];
          cumStats[winner.roster_id].wins++;
        }
      }

      // Sort by wins desc, pf desc; assign rank 1..N
      const sorted = Object.entries(cumStats)
        .map(([id, s]) => ({ rosterId: Number(id), ...s }))
        .sort((a, b) => b.wins - a.wins || b.pf - a.pf);

      const row: Record<string, number> = { week };
      sorted.forEach((s, i) => {
        row[`r${s.rosterId}`] = i + 1;
      });
      return row;
    });
  }, [weeklyMatchups]);

  // All roster IDs that appear in the standings data
  const rosterIds = useMemo(() => {
    const ids = new Set<number>();
    standingsRaceData.forEach((row) => {
      Object.keys(row).forEach((k) => {
        if (k.startsWith("r")) ids.add(Number(k.slice(1)));
      });
    });
    return [...ids].sort((a, b) => a - b);
  }, [standingsRaceData]);

  // ── Chart 3: PF vs PA ─────────────────────────────────────────────────────
  const pfPaData = useMemo(() => {
    return stats
      .filter((s) => s.season === activeSeason)
      .map((s) => ({
        name: teamNameMap.get(s.rosterId) ?? `Team ${s.rosterId}`,
        pf: +s.pointsFor.toFixed(2),
        pa: +s.pointsAgainst.toFixed(2),
      }))
      .sort((a, b) => b.pf - a.pf);
  }, [stats, activeSeason, teamNameMap]);

  // ── Chart 4: All-Time Win % ───────────────────────────────────────────────
  const allTimeWinPctData = useMemo(() => {
    const byRoster: Record<number, { wins: number; losses: number }> = {};
    for (const s of stats) {
      if (!byRoster[s.rosterId]) byRoster[s.rosterId] = { wins: 0, losses: 0 };
      byRoster[s.rosterId].wins += s.wins;
      byRoster[s.rosterId].losses += s.losses;
    }
    return Object.entries(byRoster)
      .map(([id, r]) => {
        const total = r.wins + r.losses;
        const pct = total > 0 ? +(r.wins / total * 100).toFixed(1) : 0;
        return {
          name: teamNameMap.get(Number(id)) ?? `Team ${id}`,
          pct,
          wins: r.wins,
          losses: r.losses,
          fill: pct >= 50 ? CR_BLUE : CR_RED,
        };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [stats, teamNameMap]);

  const isBaseLoading = statsLoading || teamsLoading;

  return (
    <div>
      <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 900 }}>
        <span style={{ color: "var(--cr-red)" }}>League</span> Stats
      </h1>
      <p style={{ margin: "0 0 24px", color: "var(--cr-text-muted)", fontSize: 15 }}>
        Charts, graphs, and deep dives into the numbers.
      </p>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={labelStyle}>Season</label>
          <select
            style={selectStyle}
            value={activeSeason ?? ""}
            onChange={(e) => {
              setSelectedSeason(Number(e.target.value));
              setSelectedTeamId(null);
            }}
            disabled={isBaseLoading}
          >
            {seasons.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={labelStyle}>Team (Points Per Week)</label>
          <select
            style={selectStyle}
            value={activeTeamId ?? ""}
            onChange={(e) => setSelectedTeamId(Number(e.target.value))}
            disabled={isBaseLoading}
          >
            {teams.map((t) => (
              <option key={t.rosterId} value={t.rosterId}>{t.teamName}</option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))",
          gap: 16,
        }}
      >
        {/* Chart 1: Points Per Week */}
        <div style={cardStyle}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>
            Points Per Week
          </div>
          <div style={{ fontSize: 13, color: "var(--cr-text-muted)", marginBottom: 16 }}>
            Week-by-week scoring vs. league average.
          </div>
          {matchupsLoading ? (
            <LoadingBox />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={pointsPerWeekData} margin={{ bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 12 }}
                  label={{ value: "Week", position: "insideBottom", offset: -8, fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => String((Number(v) || 0).toFixed(2))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="team"
                  name={teamNameMap.get(activeTeamId ?? 0) ?? "Team"}
                  stroke={CR_RED}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="avg"
                  name="League Avg"
                  stroke={CR_TEXT_MUTED}
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 2: Standings Race */}
        <div style={cardStyle}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>
            Standings Race
          </div>
          <div style={{ fontSize: 13, color: "var(--cr-text-muted)", marginBottom: 16 }}>
            Cumulative rank by week — #1 at the top.
          </div>
          {matchupsLoading ? (
            <LoadingBox />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={standingsRaceData} margin={{ right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis
                  reversed
                  domain={[1, rosterIds.length || 1]}
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  label={{ value: "Rank", angle: -90, position: "insideLeft", offset: 12, fontSize: 12 }}
                />
                <Tooltip
                  formatter={(v, name) => {
                    const id = Number(String(name).replace(/^r/, ""));
                    return [v ?? 0, teamNameMap.get(id) ?? String(name)];
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(name: string) => {
                    const id = Number(name.replace(/^r/, ""));
                    const n = teamNameMap.get(id) ?? name;
                    return n.split(" ")[0];
                  }}
                />
                {rosterIds.map((id, i) => (
                  <Line
                    key={id}
                    type="monotone"
                    dataKey={`r${id}`}
                    name={`r${id}`}
                    stroke={TEAM_COLORS[i % TEAM_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 3: PF vs PA */}
        <div style={cardStyle}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>
            Points For vs Points Against
          </div>
          <div style={{ fontSize: 13, color: "var(--cr-text-muted)", marginBottom: 16 }}>
            Offense vs. defense for the {activeSeason ?? "…"} season.
          </div>
          {isBaseLoading ? (
            <LoadingBox />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={pfPaData} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  height={52}
                  tickFormatter={(v: string) => v.split(" ")[0].slice(0, 8)}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="pf" name="Points For" fill={CR_RED} />
                <Bar dataKey="pa" name="Points Against" fill={CR_BLUE} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 4: All-Time Win % */}
        <div style={cardStyle}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>
            All-Time Win Percentage
          </div>
          <div style={{ fontSize: 13, color: "var(--cr-text-muted)", marginBottom: 16 }}>
            Win rate per team across all seasons, best to worst.
          </div>
          {isBaseLoading ? (
            <LoadingBox />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart layout="vertical" data={allTimeWinPctData} margin={{ right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={110}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => (v.length > 13 ? v.slice(0, 12) + "…" : v)}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value, _name, item) => {
                    const d = item.payload as { wins: number; losses: number };
                    return [`${value}% (${d.wins}W–${d.losses}L)`, "Win %"];
                  }}
                />
                <Bar dataKey="pct" name="Win %" radius={[0, 4, 4, 0]}>
                  {allTimeWinPctData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
