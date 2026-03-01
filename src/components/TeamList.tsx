import React from "react";
import { Link } from "react-router-dom";
import { sleeperAvatarUrl, slugifyTeamName, type TeamInfo } from "../lib/sleeper";

// Re-export for backward compatibility with useTeams.ts
export type { TeamInfo };

type TeamListProps = {
  teams: TeamInfo[];
  allTimeRecords?: Record<number, { wins: number; losses: number }>;
};

export const TeamList: React.FC<TeamListProps> = ({ teams, allTimeRecords }) => {
  if (teams.length === 0) return <p>No teams found.</p>;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 12,
      }}
    >
      {teams.map((team) => {
        const slug = slugifyTeamName(team.teamName);
        const teamKey = `${team.rosterId}-${slug}`;
        const record = allTimeRecords?.[team.rosterId];

        return (
          <Link
            key={team.rosterId}
            to={`/teams/${teamKey}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid var(--cr-border)",
              textDecoration: "none",
              color: "var(--cr-text)",
              background: "var(--cr-surface)",
              transition: "box-shadow 0.15s ease, transform 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
              (e.currentTarget as HTMLElement).style.transform = "none";
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
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
                <span style={{ fontWeight: 800, fontSize: 18 }}>
                  {team.teamName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 15,
                  lineHeight: 1.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={team.teamName}
              >
                {team.teamName}
              </div>
              <div style={{ fontSize: 13, color: "var(--cr-text-muted)", marginTop: 3 }}>
                {team.ownerName}
              </div>
              {record && (
                <div style={{ fontSize: 12, color: "var(--cr-text-muted)", marginTop: 2 }}>
                  {record.wins}-{record.losses} · all-time
                </div>
              )}
            </div>

            <span style={{ color: "var(--cr-text-muted)", fontSize: 18, flexShrink: 0 }}>→</span>
          </Link>
        );
      })}
    </div>
  );
};
