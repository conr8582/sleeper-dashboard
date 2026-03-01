import { useEffect, useState } from "react";
import {
  LEAGUE_ID,
  START_SEASON,
  getLeagueHistoryFromCurrent,
} from "../lib/sleeper";
import { useTeams } from "../hooks/useTeams";
import { useWeekMatchups } from "../hooks/useWeekMatchups";
import { MatchupList } from "../components/MatchupList";

export function WeeksPage() {
  const { teams, loading: teamsLoading, error: teamsError } = useTeams();

  const [leagues, setLeagues] = useState<{ leagueId: string; season: number }[]>([]);
  const [leaguesLoading, setLeaguesLoading] = useState(true);
  const [leaguesError, setLeaguesError] = useState<string | null>(null);

  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(1);

  useEffect(() => {
    getLeagueHistoryFromCurrent(LEAGUE_ID, START_SEASON)
      .then((result) => {
        setLeagues(result);
        if (result.length > 0) {
          // Default to most recent season
          setSelectedLeagueId(result[result.length - 1].leagueId);
        }
      })
      .catch((err) => {
        setLeaguesError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        setLeaguesLoading(false);
      });
  }, []);

  const { matchups, loading: matchupsLoading, error: matchupsError } = useWeekMatchups(
    selectedLeagueId,
    selectedWeek
  );

  function handleSeasonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedLeagueId(e.target.value);
    setSelectedWeek(1);
  }

  if (leaguesLoading || teamsLoading) return <div>Loading…</div>;
  if (leaguesError) return <div style={{ color: "crimson" }}>Error: {leaguesError}</div>;
  if (teamsError) return <div style={{ color: "crimson" }}>Error: {teamsError}</div>;

  return (
    <div style={{ marginTop: 16 }}>
      <h1 style={{ margin: 0 }}>Weekly Matchups</h1>

      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 16,
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontWeight: 600 }}>Season</label>
          <select
            value={selectedLeagueId ?? ""}
            onChange={handleSeasonChange}
            style={{ padding: "8px 10px", borderRadius: 8 }}
          >
            {[...leagues].reverse().map((l) => (
              <option key={l.leagueId} value={l.leagueId}>
                {l.season}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontWeight: 600 }}>Week</label>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            style={{ padding: "8px 10px", borderRadius: 8 }}
          >
            {Array.from({ length: 17 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                Week {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        {matchupsLoading ? (
          <div>Loading matchups…</div>
        ) : matchupsError ? (
          <div style={{ color: "crimson" }}>Error: {matchupsError}</div>
        ) : (
          <MatchupList week={selectedWeek} matchups={matchups} teams={teams} />
        )}
      </div>
    </div>
  );
}
