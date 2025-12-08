import { useEffect, useState } from "react";

const LEAGUE_ID = "1257481742223163392"; // your Sleeper league ID

type League = {
  name: string;
  season: string;
};

function App() {
  const [league, setLeague] = useState<League | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeague() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `https://api.sleeper.app/v1/league/${LEAGUE_ID}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = (await response.json()) as {
          name: string;
          season: string | number;
        };

        // We only pick out the fields we care about for now
        const leagueData: League = {
          name: data.name,
          season: String(data.season),
        };

        setLeague(leagueData);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeague();
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Sleeper League Dashboard (Day 2)</h1>

      {/* Status area */}
      {isLoading && <p>Loading league data...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {/* League info */}
      {league && (
        <div style={{ marginTop: "1rem" }}>
          <h2>{league.name}</h2>
          <p>Season: {league.season}</p>
        </div>
      )}
    </div>
  );
}

export default App;
