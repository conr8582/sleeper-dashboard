// src/components/MatchupList.tsx
import React from "react";

// Local copies of the types we care about.
// We DON'T import from App.tsx to avoid circular dependencies.

interface SleeperMatchup {
  matchup_id: number | null;
  roster_id: number;
  points: number;
}

interface TeamInfo {
  rosterId: number;
  ownerName: string;
}

type MatchupRow = {
  rosterId: number;
  ownerName: string;
  points: number;
};

interface MatchupGroup {
  id: number;
  rows: MatchupRow[];
}

interface MatchupListProps {
  week: number;
  matchups: SleeperMatchup[];
  teams: TeamInfo[];
}

export const MatchupList: React.FC<MatchupListProps> = ({
  week,
  matchups,
  teams,
}) => {
  // 1) Group by matchup_id and join with teams
  const groupsById: Record<number, MatchupGroup> = {};

  matchups
    .filter((m) => m.matchup_id !== null)
    .forEach((m) => {
      const matchupId = m.matchup_id as number;

      if (!groupsById[matchupId]) {
        groupsById[matchupId] = { id: matchupId, rows: [] };
      }

      const team = teams.find((t) => t.rosterId === m.roster_id);

      groupsById[matchupId].rows.push({
        rosterId: m.roster_id,
        ownerName: team?.ownerName ?? `Roster ${m.roster_id}`,
        points: m.points,
      });
    });

  const matchupGroups = Object.values(groupsById);

  return (
    <section>
      <h3>Week {week} Matchups</h3>

      {matchupGroups.length === 0 ? (
        <p>No matchups found for this week.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {matchupGroups.map((matchup) => (
            <div
              key={matchup.id}
              style={{
                padding: "1rem",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              <h4>Matchup {matchup.id}</h4>
              {matchup.rows.map((row) => (
                <p key={row.rosterId}>
                  <strong>{row.ownerName}</strong> —{" "}
                  {row.points.toFixed(2)} pts
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
