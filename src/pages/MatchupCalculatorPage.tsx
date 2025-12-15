import { useMemo, useState } from "react";
import { useTeams } from "../hooks/useTeams";

const CURRENT_LEAGUE_ID = "1257481742223163392";
const START_SEASON = 2023;

type SleeperLeague = {
  league_id: string;
  season: string; // "2025"
  previous_league_id: string | null;
};

type SleeperMatchup = {
  matchup_id: number | null;
  roster_id: number;
  points: number;
};

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

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status}) for ${url}`);
  return res.json();
}

async function getLeagueHistoryFromCurrent(
  currentLeagueId: string,
  startSeason: number
): Promise<{ leagueId: string; season: number }[]> {
  const out: { leagueId: string; season: number }[] = [];

  let leagueId: string | null = currentLeagueId;

  while (leagueId) {
    const league = await fetchJSON<SleeperLeague>(
      `https://api.sleeper.app/v1/league/${leagueId}`
    );

    const seasonNum = Number(league.season);
    if (!Number.isFinite(seasonNum)) break;
    if (seasonNum < startSeason) break;

    out.push({ leagueId: league.league_id, season: seasonNum });
    leagueId = league.previous_league_id;
  }

  return out.sort((a, b) => a.season - b.season);
}

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
  const leagues = await getLeagueHistoryFromCurrent(CURRENT_LEAGUE_ID, START_SEASON);

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
): { opponentRosterId: number; games: number; wins: number; losses: number; ties: number; ptsFor: number; ptsAgainst: number; diff: number }[] {
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
  const leagues = await getLeagueHistoryFromCurrent(CURRENT_LEAGUE_ID, START_SEASON);
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

  return (
    <div style={{ marginTop: 16 }}>
      <h1 style={{ margin: 0 }}>Matchup Calculator</h1>
      <p style={{ marginTop: 8 }}>
        Compare two teams (head-to-head) or one team vs everyone (since {START_SEASON}).
      </p>

      {/* Head-to-head */}
      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 14,
          marginTop: 12,
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Head-to-head</div>

        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontWeight: 600 }}>Team A</label>
            <select
              value={teamA}
              onChange={(e) => {
                setResult(null);
                setCompareError(null);
                setTeamA(e.target.value === "" ? "" : Number(e.target.value));
              }}
              style={{ padding: "8px 10px", borderRadius: 8 }}
            >
              <option value="">Select a team…</option>
              {teamOptions.map((t) => (
                <option key={t.rosterId} value={t.rosterId}>
                  {t.ownerName} (Roster {t.rosterId})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontWeight: 600 }}>Team B</label>
            <select
              value={teamB}
              onChange={(e) => {
                setResult(null);
                setCompareError(null);
                setTeamB(e.target.value === "" ? "" : Number(e.target.value));
              }}
              style={{ padding: "8px 10px", borderRadius: 8 }}
            >
              <option value="">Select a team…</option>
              {teamOptions.map((t) => (
                <option key={t.rosterId} value={t.rosterId}>
                  {t.ownerName} (Roster {t.rosterId})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCompare}
            disabled={!canCompare}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              fontWeight: 700,
              cursor: canCompare ? "pointer" : "not-allowed",
              opacity: canCompare ? 1 : 0.6,
            }}
          >
            {comparing ? "Comparing…" : "Compare"}
          </button>
        </div>

        {teamA !== "" && teamB !== "" && teamA === teamB && (
          <p style={{ marginTop: 12, color: "crimson" }}>Pick two different teams.</p>
        )}

        {compareError && <p style={{ marginTop: 12, color: "crimson" }}>Error: {compareError}</p>}

        {result && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>
              {teamAName} vs {teamBName}
            </div>

            <div style={{ opacity: 0.85, marginBottom: 10 }}>
              Seasons scanned: {result.seasonsCovered.join(", ")} • Games found: {result.games}
            </div>

            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 700 }}>Record (Team A perspective)</div>
                <div>
                  {result.teamAWins}-{result.teamBWins}
                  {result.ties > 0 ? `-${result.ties}` : ""}{" "}
                  {result.ties > 0 ? "(W-L-T)" : "(W-L)"}
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700 }}>Total points</div>
                <div>
                  {teamAName}: {result.totalPointsA.toFixed(2)} • {teamBName}:{" "}
                  {result.totalPointsB.toFixed(2)}
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700 }}>Point differential</div>
                <div>
                  Total (A−B): {result.totalDiffA.toFixed(2)} • Avg / game:{" "}
                  {result.avgDiffA.toFixed(2)}
                </div>
              </div>
            </div>

            {result.bySeason.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>By season</div>

                <div style={{ display: "grid", gap: 8 }}>
                  {result.bySeason.map((s) => {
                    const avg = s.games > 0 ? s.diffA / s.games : 0;
                    const record =
                      s.ties > 0
                        ? `${s.aWins}-${s.bWins}-${s.ties} (W-L-T)`
                        : `${s.aWins}-${s.bWins} (W-L)`;

                    return (
                      <div
                        key={s.season}
                        style={{
                          border: "1px solid #f0f0f0",
                          borderRadius: 10,
                          padding: 10,
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ minWidth: 120 }}>
                          <div style={{ fontWeight: 800 }}>{s.season}</div>
                          <div style={{ opacity: 0.85 }}>
                            {s.games} game{s.games === 1 ? "" : "s"}
                          </div>
                        </div>

                        <div style={{ minWidth: 170 }}>
                          <div style={{ fontWeight: 700 }}>Record</div>
                          <div>{record}</div>
                        </div>

                        <div style={{ minWidth: 220 }}>
                          <div style={{ fontWeight: 700 }}>Points</div>
                          <div>
                            {teamAName}: {s.ptsA.toFixed(2)} • {teamBName}: {s.ptsB.toFixed(2)}
                          </div>
                        </div>

                        <div style={{ minWidth: 240 }}>
                          <div style={{ fontWeight: 700 }}>Point diff (A−B)</div>
                          <div>
                            Total: {s.diffA.toFixed(2)} • Avg / game: {avg.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {result.games === 0 && (
              <p style={{ marginTop: 10, opacity: 0.85 }}>
                No head-to-head games found between these roster IDs since {START_SEASON}.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Vs Everyone */}
      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 14,
          marginTop: 14,
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Team vs everyone</div>

        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontWeight: 600 }}>Team</label>
            <select
              value={teamAll}
              onChange={(e) => {
                setAllResult(null);
                setCompareAllError(null);
                setTeamAll(e.target.value === "" ? "" : Number(e.target.value));
              }}
              style={{ padding: "8px 10px", borderRadius: 8 }}
            >
              <option value="">Select a team…</option>
              {teamOptions.map((t) => (
                <option key={t.rosterId} value={t.rosterId}>
                  {t.ownerName} (Roster {t.rosterId})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCompareAll}
            disabled={!canCompareAll}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              fontWeight: 700,
              cursor: canCompareAll ? "pointer" : "not-allowed",
              opacity: canCompareAll ? 1 : 0.6,
            }}
          >
            {comparingAll ? "Comparing…" : "Compare vs All"}
          </button>
        </div>

        {compareAllError && (
          <p style={{ marginTop: 12, color: "crimson" }}>Error: {compareAllError}</p>
        )}

        {allResult && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>{teamAllName} vs everyone</div>
            <div style={{ opacity: 0.85, marginBottom: 10 }}>
              Seasons scanned: {allResult.seasonsCovered.join(", ")} • Opponents:{" "}
              {allResult.rows.length}
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {allResult.rows.map((r) => {
                const oppName = nameForRoster(r.opponentRosterId);
                const avg = r.games > 0 ? r.diff / r.games : 0;
                const record =
                  r.ties > 0
                    ? `${r.wins}-${r.losses}-${r.ties} (W-L-T)`
                    : `${r.wins}-${r.losses} (W-L)`;

                return (
                  <div
                    key={r.opponentRosterId}
                    style={{
                      border: "1px solid #f0f0f0",
                      borderRadius: 10,
                      padding: 10,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ minWidth: 220 }}>
                      <div style={{ fontWeight: 800 }}>{oppName}</div>
                      <div style={{ opacity: 0.85 }}>
                        Roster {r.opponentRosterId} • {r.games} game{r.games === 1 ? "" : "s"}
                      </div>
                    </div>

                    <div style={{ minWidth: 170 }}>
                      <div style={{ fontWeight: 700 }}>Record</div>
                      <div>{record}</div>
                    </div>

                    <div style={{ minWidth: 280 }}>
                      <div style={{ fontWeight: 700 }}>Point diff (For−Against)</div>
                      <div>
                        Total: {r.diff.toFixed(2)} • Avg / game: {avg.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {allResult.rows.length === 0 && (
              <p style={{ marginTop: 10, opacity: 0.85 }}>
                No matchups found for this team since {START_SEASON}.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
