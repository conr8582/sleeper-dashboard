import React from "react";

export interface TeamInfo {
  rosterId: number;
  ownerName: string;
}

type TeamListProps = {
  teams: TeamInfo[];
};

export const TeamList: React.FC<TeamListProps> = ({ teams }) => {
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
