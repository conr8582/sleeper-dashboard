import React from "react";
import { Link } from "react-router-dom";
import { sleeperAvatarUrl, slugifyTeamName, type TeamInfo } from "../lib/sleeper";

// Re-export for backward compatibility with useTeams.ts
export type { TeamInfo };

type TeamListProps = {
  teams: TeamInfo[];
};

export const TeamList: React.FC<TeamListProps> = ({ teams }) => {
  if (teams.length === 0) return <p>No teams found.</p>;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 14,
        marginTop: 12,
      }}
    >
      {teams.map((team) => {
        const slug = slugifyTeamName(team.teamName);
        const teamKey = `${team.rosterId}-${slug}`;

        return (
          <Link
            key={team.rosterId}
            to={`/teams/${teamKey}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 14,
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.08)",
              textDecoration: "none",
              color: "inherit",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                overflow: "hidden",
                background: "rgba(0,0,0,0.06)",
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
              }}
              aria-hidden
            >
              {team.avatarId ? (
                <img
                  src={sleeperAvatarUrl(team.avatarId)}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  loading="lazy"
                />
              ) : (
                <span style={{ fontWeight: 800, opacity: 0.7 }}>
                  {team.teamName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 16,
                  lineHeight: 1.15,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={team.teamName}
              >
                {team.teamName}
              </div>
              <div style={{ fontSize: 13, opacity: 0.65, marginTop: 4 }}>
                View team →
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
