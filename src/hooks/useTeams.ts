import { useEffect, useState } from "react";
import {
  LEAGUE_ID,
  fetchJSON,
  type SleeperUser,
  type SleeperRoster,
  type TeamInfo,
} from "../lib/sleeper";

function cleanName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function useTeams() {
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeams() {
      try {
        setLoading(true);
        setError(null);

        const [users, rosters] = await Promise.all([
          fetchJSON<SleeperUser[]>(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/users`),
          fetchJSON<SleeperRoster[]>(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/rosters`),
        ]);

        const joined: TeamInfo[] = rosters.map((r) => {
          const owner = users.find((u) => u.user_id === r.owner_id);

          const teamName =
            cleanName(r.metadata?.team_name) ||
            cleanName(owner?.metadata?.team_name) ||
            cleanName(owner?.display_name) ||
            `Team #${r.roster_id}`;

          const avatarId = r.metadata?.avatar ?? owner?.avatar ?? null;

          return {
            rosterId: r.roster_id,
            teamName,
            ownerName: owner?.display_name ?? "Unknown owner",
            avatarId,
          };
        });

        joined.sort((a, b) => a.rosterId - b.rosterId);
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
