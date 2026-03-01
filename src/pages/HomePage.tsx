import { Link } from "react-router-dom";
import { useSeasonStats } from "../hooks/useSeasonStats";
import { useTeams } from "../hooks/useTeams";
import { sleeperAvatarUrl } from "../lib/sleeper";
import "./HomePage.css";

const NAV_CARDS = [
  { to: "/teams", icon: "👥", label: "Teams", desc: "Rosters & all-time records" },
  { to: "/seasons", icon: "📅", label: "Seasons", desc: "Year-by-year standings" },
  { to: "/stats", icon: "📊", label: "Stats", desc: "Charts & deep dives" },
  { to: "/awards", icon: "🏆", label: "Awards", desc: "Records & hall of fame" },
  { to: "/matchup-calculator", icon: "⚔️", label: "Matchup Calc", desc: "Head-to-head history" },
];

const CHAMPIONS = [
  { year: 2023, name: "Friends of Red Jenny" },
  { year: 2024, name: "Baker Mayfields" },
  { year: 2025, name: "Oinkie Little Pig Boys" },
];

export function HomePage() {
  const { stats, loading: statsLoading } = useSeasonStats();
  const { teams, loading: teamsLoading } = useTeams();

  // Find the most recent season
  const seasons = [...new Set(stats.map((s) => s.season))].sort((a, b) => b - a);
  const latestSeason = seasons[0];

  // Top 5 by wins → PF in the most recent season
  const powerRankings = latestSeason
    ? stats
        .filter((s) => s.season === latestSeason)
        .sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor)
        .slice(0, 5)
    : [];

  return (
    <div>
      {/* Hero */}
      <div className="home-hero">
        <div className="home-hero-emoji">🏈</div>
        <h1 className="home-hero-title">
          <span className="home-hero-crum">CRUM</span>
          <span className="home-hero-pin">PIN</span>
        </h1>
        <p className="home-hero-sub">Fantasy Football League · Est. 2023</p>
        <div className="home-hero-bar" />
      </div>

      {/* Nav cards */}
      <div className="home-cards">
        {NAV_CARDS.map((card) => (
          <Link key={card.to} to={card.to} className="home-card">
            <span className="home-card-icon">{card.icon}</span>
            <span className="home-card-label">{card.label}</span>
            <span className="home-card-desc">{card.desc}</span>
          </Link>
        ))}
      </div>

      {/* Power Rankings */}
      <div className="home-section">
        <h2 className="home-section-title">
          <span style={{ color: "var(--cr-red)" }}>{latestSeason}</span> Power Rankings
        </h2>

        {statsLoading || teamsLoading ? (
          <div style={{ color: "var(--cr-text-muted)", padding: "12px 0" }}>Loading…</div>
        ) : (
          <>
            <div className="home-rankings">
              {powerRankings.map((row, i) => {
                const team = teams.find((t) => t.rosterId === row.rosterId);
                const name = team?.teamName ?? `Roster ${row.rosterId}`;
                const owner = team?.ownerName ?? "";
                const avatarId = team?.avatarId;

                return (
                  <div key={row.rosterId} className="home-rank-row">
                    <span className="home-rank-badge">{i + 1}</span>
                    <div className="home-rank-avatar" aria-hidden>
                      {avatarId ? (
                        <img src={sleeperAvatarUrl(avatarId)} alt="" />
                      ) : (
                        <span>{name.slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="home-rank-info">
                      <span className="home-rank-name">{name}</span>
                      <span className="home-rank-owner">{owner}</span>
                    </div>
                    <span className="home-rank-record">
                      {row.wins}-{row.losses}
                    </span>
                    <span className="home-rank-pf">{row.pointsFor.toFixed(0)}</span>
                  </div>
                );
              })}
            </div>
            <Link to="/seasons" className="home-link-more">
              View full standings →
            </Link>
          </>
        )}
      </div>

      {/* Champions */}
      <div className="home-section">
        <h2 className="home-section-title">🏆 Champions</h2>
        <div className="home-champs">
          {CHAMPIONS.map((c) => (
            <div key={c.year} className="home-champ-card">
              <span className="home-champ-year">{c.year}</span>
              <span className="home-champ-name">{c.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
