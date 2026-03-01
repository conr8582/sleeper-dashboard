import React, { useMemo, useState } from "react";
import { useTeams } from "../hooks/useTeams";
import {
  LEAGUE_ID,
  START_SEASON,
  fetchJSON,
  getLeagueHistoryFromCurrent,
  type SleeperMatchup,
} from "../lib/sleeper";

type SeasonBreakdown = {
  season: number;
  games: number;
  aWins: number;
  bWins: number;
  ties: number;
  ptsA: number;
  ptsB: number;
  diffA: number; // (A - B)
};

type CompareResult = {
  seasonsCovered: number[];
  games: number;
  teamAWins: number;
  teamBWins: number;
  ties: number;
  totalPointsA: number;
  totalPointsB: number;
  totalDiffA: number; // (A - B) summed across games
  avgDiffA: number; // (A - B) / games
  bySeason: SeasonBreakdown[];
};

type OpponentRow = {
  opponentRosterId: number;
  games: number;
  wins: number;
  losses: number;
  ties: number;
  ptsFor: number;
  ptsAgainst: number;
  diff: number; // ptsFor - ptsAgainst
};

type VsAllResult = {
  seasonsCovered: number[];
  rows: OpponentRow[];
};


function computeFromMatchups(
  matchups: SleeperMatchup[],
  rosterA: number,
  rosterB: number
): {
  games: number;
  aWins: number;
  bWins: number;
  ties: number;
  ptsA: number;
  ptsB: number;
  diffA: number;
} {
  const byMatchup = new Map<number, SleeperMatchup[]>();
  for (const m of matchups) {
    if (m.matchup_id == null) continue;
    const arr = byMatchup.get(m.matchup_id) ?? [];
    arr.push(m);
    byMatchup.set(m.matchup_id, arr);
  }

  let games = 0;
  let aWins = 0;
  let bWins = 0;
  let ties = 0;
  let ptsA = 0;
  let ptsB = 0;
  let diffA = 0;

  for (const [, entries] of byMatchup) {
    const a = entries.find((e) => e.roster_id === rosterA);
    const b = entries.find((e) => e.roster_id === rosterB);
    if (!a || !b) continue;

    games += 1;
    ptsA += a.points ?? 0;
    ptsB += b.points ?? 0;

    const d = (a.points ?? 0) - (b.points ?? 0);
    diffA += d;

    if (d > 0) aWins += 1;
    else if (d < 0) bWins += 1;
    else ties += 1;
  }

  return { games, aWins, bWins, ties, ptsA, ptsB, diffA };
}

function addSeasonRow(
  map: Map<number, SeasonBreakdown>,
  season: number,
  partial: {
    games: number;
    aWins: number;
    bWins: number;
    ties: number;
    ptsA: number;
    ptsB: number;
    diffA: number;
  }
) {
  const existing =
    map.get(season) ??
    ({
      season,
      games: 0,
      aWins: 0,
      bWins: 0,
      ties: 0,
      ptsA: 0,
      ptsB: 0,
      diffA: 0,
    } satisfies SeasonBreakdown);

  existing.games += partial.games;
  existing.aWins += partial.aWins;
  existing.bWins += partial.bWins;
  existing.ties += partial.ties;
  existing.ptsA += partial.ptsA;
  existing.ptsB += partial.ptsB;
  existing.diffA += partial.diffA;

  map.set(season, existing);
}

async function compareHeadToHead(rosterA: number, rosterB: number): Promise<CompareResult> {
  const leagues = await getLeagueHistoryFromCurrent(LEAGUE_ID, START_SEASON);

  let games = 0;
  let teamAWins = 0;
  let teamBWins = 0;
  let ties = 0;
  let totalPointsA = 0;
  let totalPointsB = 0;
  let totalDiffA = 0;

  const bySeasonMap = new Map<number, SeasonBreakdown>();

  for (const { leagueId, season } of leagues) {
    for (let week = 1; week <= 30; week++) {
      let weekMatchups: SleeperMatchup[];
      try {
        weekMatchups = await fetchJSON<SleeperMatchup[]>(
          `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`
        );
      } catch {
        break;
      }

      if (!Array.isArray(weekMatchups) || weekMatchups.length === 0) break;

      const partial = computeFromMatchups(weekMatchups, rosterA, rosterB);

      games += partial.games;
      teamAWins += partial.aWins;
      teamBWins += partial.bWins;
      ties += partial.ties;
      totalPointsA += partial.ptsA;
      totalPointsB += partial.ptsB;
      totalDiffA += partial.diffA;

      if (partial.games > 0) addSeasonRow(bySeasonMap, season, partial);
    }
  }

  const seasonsCovered = leagues.map((l) => l.season);
  const avgDiffA = games > 0 ? totalDiffA / games : 0;
  const bySeason = Array.from(bySeasonMap.values()).sort((a, b) => a.season - b.season);

  return {
    seasonsCovered,
    games,
    teamAWins,
    teamBWins,
    ties,
    totalPointsA,
    totalPointsB,
    totalDiffA,
    avgDiffA,
    bySeason,
  };
}

function upsertOpponentRow(
  map: Map<number, OpponentRow>,
  opponentRosterId: number,
  partial: {
    games: number;
    wins: number;
    losses: number;
    ties: number;
    ptsFor: number;
    ptsAgainst: number;
    diff: number;
  }
) {
  const existing =
    map.get(opponentRosterId) ??
    ({
      opponentRosterId,
      games: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      ptsFor: 0,
      ptsAgainst: 0,
      diff: 0,
    } satisfies OpponentRow);

  existing.games += partial.games;
  existing.wins += partial.wins;
  existing.losses += partial.losses;
  existing.ties += partial.ties;
  existing.ptsFor += partial.ptsFor;
  existing.ptsAgainst += partial.ptsAgainst;
  existing.diff += partial.diff;

  map.set(opponentRosterId, existing);
}

function computeVsAllFromWeek(
  matchups: SleeperMatchup[],
  targetRosterId: number
): {
  opponentRosterId: number;
  games: number;
  wins: number;
  losses: number;
  ties: number;
  ptsFor: number;
  ptsAgainst: number;
  diff: number;
}[] {
  // Group by matchup_id (each matchup_id is one “game” between two rosters)
  const byMatchup = new Map<number, SleeperMatchup[]>();
  for (const m of matchups) {
    if (m.matchup_id == null) continue;
    const arr = byMatchup.get(m.matchup_id) ?? [];
    arr.push(m);
    byMatchup.set(m.matchup_id, arr);
  }

  const out: {
    opponentRosterId: number;
    games: number;
    wins: number;
    losses: number;
    ties: number;
    ptsFor: number;
    ptsAgainst: number;
    diff: number;
  }[] = [];

  for (const [, entries] of byMatchup) {
    const me = entries.find((e) => e.roster_id === targetRosterId);
    if (!me) continue;

    // In standard head-to-head, your opponent is the other roster in this matchup_id
    const opp = entries.find((e) => e.roster_id !== targetRosterId);
    if (!opp) continue;

    const ptsFor = me.points ?? 0;
    const ptsAgainst = opp.points ?? 0;
    const diff = ptsFor - ptsAgainst;

    let wins = 0;
    let losses = 0;
    let ties = 0;
    if (diff > 0) wins = 1;
    else if (diff < 0) losses = 1;
    else ties = 1;

    out.push({
      opponentRosterId: opp.roster_id,
      games: 1,
      wins,
      losses,
      ties,
      ptsFor,
      ptsAgainst,
      diff,
    });
  }

  return out;
}

async function compareVsAll(targetRosterId: number): Promise<VsAllResult> {
  const leagues = await getLeagueHistoryFromCurrent(LEAGUE_ID, START_SEASON);
  const seasonsCovered = leagues.map((l) => l.season);

  const opponentMap = new Map<number, OpponentRow>();

  for (const { leagueId } of leagues) {
    for (let week = 1; week <= 30; week++) {
      let weekMatchups: SleeperMatchup[];
      try {
        weekMatchups = await fetchJSON<SleeperMatchup[]>(
          `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`
        );
      } catch {
        break;
      }

      if (!Array.isArray(weekMatchups) || weekMatchups.length === 0) break;

      const partialRows = computeVsAllFromWeek(weekMatchups, targetRosterId);
      for (const row of partialRows) {
        upsertOpponentRow(opponentMap, row.opponentRosterId, row);
      }
    }
  }

  const rows = Array.from(opponentMap.values())
    .filter((r) => r.opponentRosterId !== targetRosterId)
    .sort((a, b) => {
      // Default sort: most games together first, then biggest diff
      if (b.games !== a.games) return b.games - a.games;
      return b.diff - a.diff;
    });

  return { seasonsCovered, rows };
}

export function MatchupCalculatorPage() {
  const { teams, loading, error } = useTeams();

  // Head-to-head mode
  const [teamA, setTeamA] = useState<number | "">("");
  const [teamB, setTeamB] = useState<number | "">("");

  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);

  // Vs all mode
  const [teamAll, setTeamAll] = useState<number | "">("");
  const [comparingAll, setComparingAll] = useState(false);
  const [compareAllError, setCompareAllError] = useState<string | null>(null);
  const [allResult, setAllResult] = useState<VsAllResult | null>(null);

  const canCompare = teamA !== "" && teamB !== "" && teamA !== teamB && !comparing;
  const canCompareAll = teamAll !== "" && !comparingAll;

  const teamOptions = useMemo(() => {
    return [...teams].sort((a, b) => a.ownerName.localeCompare(b.ownerName));
  }, [teams]);

  const nameForRoster = (rosterId: number) =>
    teams.find((t) => t.rosterId === rosterId)?.ownerName ?? `Roster ${rosterId}`;

  const teamAName = teamA === "" ? "" : nameForRoster(teamA);
  const teamBName = teamB === "" ? "" : nameForRoster(teamB);
  const teamAllName = teamAll === "" ? "" : nameForRoster(teamAll);

  async function handleCompare() {
    if (teamA === "" || teamB === "" || teamA === teamB) return;

    setComparing(true);
    setCompareError(null);
    setResult(null);

    try {
      const r = await compareHeadToHead(teamA, teamB);
      setResult(r);
    } catch (err) {
      setCompareError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setComparing(false);
    }
  }

  async function handleCompareAll() {
    if (teamAll === "") return;

    setComparingAll(true);
    setCompareAllError(null);
    setAllResult(null);

    try {
      const r = await compareVsAll(teamAll);
      setAllResult(r);
    } catch (err) {
      setCompareAllError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setComparingAll(false);
    }
  }

  if (loading) return <div>Loading teams…</div>;
  if (error) return <div style={{ color: "crimson" }}>Error: {error}</div>;

  const panelStyle: React.CSSProperties = {
    border: "1px solid var(--cr-border)",
    borderRadius: 12,
    padding: 20,
    background: "var(--cr-surface)",
    flex: "1 1 0",
    minWidth: 0,
  };

  const selectStyle: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid var(--cr-border)",
    fontSize: 14,
    background: "#fff",
    color: "var(--cr-text)",
  };

  const btnStyle = (enabled: boolean): React.CSSProperties => ({
    padding: "10px 18px",
    borderRadius: 10,
    border: "1px solid var(--cr-border)",
    fontWeight: 700,
    fontSize: 14,
    cursor: enabled ? "pointer" : "not-allowed",
    opacity: enabled ? 1 : 0.5,
    background: enabled ? "var(--cr-red)" : "var(--cr-surface)",
    color: enabled ? "#fff" : "var(--cr-text-muted)",
  });

  return (
    <div>
      <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 900 }}>Matchup Calculator</h1>
      <p style={{ margin: "0 0 24px", color: "var(--cr-text-muted)", fontSize: 15 }}>
        Compare two teams head-to-head or one team vs everyone, since {START_SEASON}.
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Head-to-head */}
        <div style={panelStyle}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14 }}>Head-to-Head</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontWeight: 600, fontSize: 13 }}>Team A</label>
              <select
                value={teamA}
                onChange={(e) => {
                  setResult(null);
                  setCompareError(null);
                  setTeamA(e.target.value === "" ? "" : Number(e.target.value));
                }}
                style={selectStyle}
              >
                <option value="">Select a team…</option>
                {teamOptions.map((t) => (
                  <option key={t.rosterId} value={t.rosterId}>
                    {t.ownerName}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontWeight: 600, fontSize: 13 }}>Team B</label>
              <select
                value={teamB}
                onChange={(e) => {
                  setResult(null);
                  setCompareError(null);
                  setTeamB(e.target.value === "" ? "" : Number(e.target.value));
                }}
                style={selectStyle}
              >
                <option value="">Select a team…</option>
                {teamOptions.map((t) => (
                  <option key={t.rosterId} value={t.rosterId}>
                    {t.ownerName}
                  </option>
                ))}
              </select>
            </div>

            <button onClick={handleCompare} disabled={!canCompare} style={btnStyle(canCompare)}>
              {comparing ? "Comparing…" : "Compare"}
            </button>
          </div>

          {teamA !== "" && teamB !== "" && teamA === teamB && (
            <p style={{ marginTop: 12, color: "crimson", fontSize: 13 }}>
              Pick two different teams.
            </p>
          )}
          {compareError && (
            <p style={{ marginTop: 12, color: "crimson", fontSize: 13 }}>Error: {compareError}</p>
          )}

          {result && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15 }}>
                {teamAName} vs {teamBName}
              </div>
              <div style={{ color: "var(--cr-text-muted)", fontSize: 13, marginBottom: 16 }}>
                {result.games} total matchup{result.games !== 1 ? "s" : ""} ·{" "}
                {result.seasonsCovered.join(", ")}
              </div>

              {result.games > 0 ? (
                <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 36, fontWeight: 900, color: "var(--cr-red)" }}>
                      {result.teamAWins}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--cr-text-muted)", fontWeight: 600 }}>
                      {teamAName} W
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 36, fontWeight: 900, color: "var(--cr-blue)" }}>
                      {result.teamBWins}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--cr-text-muted)", fontWeight: 600 }}>
                      {teamBName} W
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: "var(--cr-text-muted)", fontSize: 13 }}>
                  No head-to-head games found since {START_SEASON}.
                </p>
              )}

              {result.bySeason.length > 0 && (
                <>
                  <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>By season</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {result.bySeason.map((s) => {
                      const record =
                        s.ties > 0
                          ? `${s.aWins}-${s.bWins}-${s.ties}`
                          : `${s.aWins}-${s.bWins}`;
                      return (
                        <div
                          key={s.season}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            background: "#fff",
                            border: "1px solid var(--cr-border)",
                            borderRadius: 8,
                            fontSize: 13,
                          }}
                        >
                          <span style={{ fontWeight: 700 }}>{s.season}</span>
                          <span style={{ color: "var(--cr-blue)", fontWeight: 600 }}>{record}</span>
                          <span style={{ color: "var(--cr-text-muted)" }}>
                            {s.ptsA.toFixed(0)} – {s.ptsB.toFixed(0)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Vs Everyone */}
        <div style={panelStyle}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14 }}>Team vs Everyone</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontWeight: 600, fontSize: 13 }}>Team</label>
              <select
                value={teamAll}
                onChange={(e) => {
                  setAllResult(null);
                  setCompareAllError(null);
                  setTeamAll(e.target.value === "" ? "" : Number(e.target.value));
                }}
                style={selectStyle}
              >
                <option value="">Select a team…</option>
                {teamOptions.map((t) => (
                  <option key={t.rosterId} value={t.rosterId}>
                    {t.ownerName}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCompareAll}
              disabled={!canCompareAll}
              style={btnStyle(canCompareAll)}
            >
              {comparingAll ? "Comparing…" : "Compare vs All"}
            </button>
          </div>

          {compareAllError && (
            <p style={{ marginTop: 12, color: "crimson", fontSize: 13 }}>
              Error: {compareAllError}
            </p>
          )}

          {allResult && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 15 }}>
                {teamAllName} vs everyone
              </div>
              <div style={{ color: "var(--cr-text-muted)", fontSize: 13, marginBottom: 14 }}>
                {allResult.rows.length} opponents · {allResult.seasonsCovered.join(", ")}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {allResult.rows.map((r) => {
                  const oppName = nameForRoster(r.opponentRosterId);
                  const record =
                    r.ties > 0
                      ? `${r.wins}-${r.losses}-${r.ties}`
                      : `${r.wins}-${r.losses}`;

                  return (
                    <div
                      key={r.opponentRosterId}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 10px",
                        background: "#fff",
                        border: "1px solid var(--cr-border)",
                        borderRadius: 8,
                        fontSize: 13,
                        gap: 8,
                      }}
                    >
                      <span style={{ fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {oppName}
                      </span>
                      <span style={{ color: "var(--cr-blue)", fontWeight: 700, flexShrink: 0 }}>
                        {record}
                      </span>
                    </div>
                  );
                })}
              </div>

              {allResult.rows.length === 0 && (
                <p style={{ color: "var(--cr-text-muted)", fontSize: 13 }}>
                  No matchups found since {START_SEASON}.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
