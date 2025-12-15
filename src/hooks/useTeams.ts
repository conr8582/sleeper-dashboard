import { useEffect, useState } from "react";
import type { TeamInfo } from "../components/TeamList";

const LEAGUE_ID = "1257481742223163392";

type SleeperUser = {
  user_id: string;
  display_name: string;
};

type SleeperRoster = {
  roster_id: number;
  owner_id: string | null;
};

export function useTeams() {
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeams() {
      try {
        setLoading(true);
        setError(null);

        const [usersRes, rostersRes] = await Promise.all([
          fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/users`),
          fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/rosters`),
        ]);

        if (!usersRes.ok) {
          throw new Error(`Users request failed: ${usersRes.status}`);
        }
        if (!rostersRes.ok) {
          throw new Error(`Rosters request failed: ${rostersRes.status}`);
        }

        const users: SleeperUser[] = await usersRes.json();
        const rosters: SleeperRoster[] = await rostersRes.json();

        const joined: TeamInfo[] = rosters.map((r) => {
          const owner = users.find((u) => u.user_id === r.owner_id);

          return {
            rosterId: r.roster_id,
            ownerName: owner?.display_name ?? "Unknown owner",
          };
        });

        setTeams(joined);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadTeams();
  }, []);

  return { teams, loading, error };
}
