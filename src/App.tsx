// src/App.tsx
import { useEffect, useState } from "react";

// ✅ Use the same league ID you used yesterday
const LEAGUE_ID = "1257481742223163392"; // <-- replace this

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

interface TeamInfo {
  rosterId: number;
  ownerName: string;
}

// ---- Components ----

type TeamListProps = {
  teams: TeamInfo[];
};

const TeamList: React.FC<TeamListProps> = ({ teams }) => {
  if (teams.length === 0) {
    return <p>No teams found.</p>;
  }

  return (
    <ul>
      {teams.map((team) => (
        <li key={team.rosterId}>
          <strong>Team #{team.rosterId}</strong> — Owner: {team.ownerName}
        </li>
      ))}
    </ul>
  );
};

function App() {
  const [league, setLeague] = useState<League | null>(null);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeagueData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 👇 Call all three endpoints in parallel
        const [leagueRes, usersRes, rostersRes] = await Promise.all([
          fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}`),
          fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/users`),
          fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/rosters`),
        ]);

        if (!leagueRes.ok) {
          throw new Error(`League request failed: ${leagueRes.status}`);
        }
        if (!usersRes.ok) {
          throw new Error(`Users request failed: ${usersRes.status}`);
        }
        if (!rostersRes.ok) {
          throw new Error(`Rosters request failed: ${rostersRes.status}`);
        }

        const leagueData: League = await leagueRes.json();
        const usersData: SleeperUser[] = await usersRes.json();
        const rostersData: SleeperRoster[] = await rostersRes.json();

        setLeague(leagueData);

        // 🔗 Join users + rosters
        const usersById: Record<string, SleeperUser> = {};
        usersData.forEach((user) => {
          usersById[user.user_id] = user;
        });

        const joinedTeams: TeamInfo[] = rostersData.map((roster) => {
          const owner = roster.owner_id
            ? usersById[roster.owner_id]
            : undefined;

          return {
            rosterId: roster.roster_id,
            ownerName: owner?.display_name ?? "Unassigned / Orphaned",
          };
        });

        setTeams(joinedTeams);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Unknown error fetching data"
        );
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
        </>
      )}
    </div>
  );
}

export default App;
