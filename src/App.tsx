// src/App.tsx
import { useEffect, useState } from "react";
import { TeamList, type TeamInfo } from "./components/TeamList";
import { MatchupList } from "./components/MatchupList";

// ✅ Use the same league ID you used yesterday
const LEAGUE_ID = "1257481742223163392";

// ---- Types ----
interface League {
  league_id: string;
  name: string;
  season: string;
}

interface SleeperUser {
  user_id: string;
  display_name: string;
}

interface SleeperRoster {
  roster_id: number;
  owner_id: string | null;
}

interface SleeperMatchup {
  matchup_id: number | null;
  roster_id: number;
  points: number;
}

function App() {
  const [league, setLeague] = useState<League | null>(null);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchups, setMatchups] = useState<SleeperMatchup[]>([]);

  useEffect(() => {
    const fetchLeagueData = async () => {
      try {
        setLoading(true);
        setError(null);

        const week = 1; // 👈 hard-coded for now

        const [leagueRes, usersRes, rostersRes, matchupsRes] = await Promise.all([
          fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}`),
          fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/users`),
          fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/rosters`),
          fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/matchups/${week}`),
        ]);

        if (!leagueRes.ok) throw new Error(`League request failed: ${leagueRes.status}`);
        if (!usersRes.ok) throw new Error(`Users request failed: ${usersRes.status}`);
        if (!rostersRes.ok) throw new Error(`Rosters request failed: ${rostersRes.status}`);
        if (!matchupsRes.ok) throw new Error(`Matchups request failed: ${matchupsRes.status}`);

        const leagueData: League = await leagueRes.json();
        const usersData: SleeperUser[] = await usersRes.json();
        const rostersData: SleeperRoster[] = await rostersRes.json();
        const matchupsData: SleeperMatchup[] = await matchupsRes.json();

        setLeague(leagueData);
        setMatchups(matchupsData);
        console.log("Matchups for week", week, matchupsData);

        // 🔗 Join users + rosters
        const usersById: Record<string, SleeperUser> = {};
        usersData.forEach((user) => {
          usersById[user.user_id] = user;
        });

        const joinedTeams: TeamInfo[] = rostersData.map((roster) => {
          const owner = roster.owner_id ? usersById[roster.owner_id] : undefined;

          return {
            rosterId: roster.roster_id,
            ownerName: owner?.display_name ?? "Unassigned / Orphaned",
          };
        });

        setTeams(joinedTeams);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unknown error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchLeagueData();
  }, []);

  return (
    <div style={{ padding: "1.5rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Sleeper League Dashboard</h1>

      {loading && <p>Loading league data...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {!loading && !error && league && (
        <>
          <section style={{ marginBottom: "1.5rem" }}>
            <h2>{league.name}</h2>
            <p>Season: {league.season}</p>
          </section>

          <section>
            <h3>Teams & Owners</h3>
            <TeamList teams={teams} />
          </section>

          <section style={{ marginTop: "2rem" }}>
            <MatchupList week={1} matchups={matchups} teams={teams} />
          </section>
        </>
      )}
    </div>
  );
}

export default App;
