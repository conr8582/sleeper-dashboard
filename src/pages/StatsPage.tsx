export function StatsPage() {
  const chartCards = [
    { title: "Points Per Week", desc: "Team scoring by week throughout the season." },
    { title: "Standings Race", desc: "How weekly ranks shifted over the season." },
    { title: "Points For vs Points Against", desc: "Bar chart comparing offense and defense." },
    { title: "All-Time Win Percentage", desc: "Bar chart of each team's all-time win rate." },
  ];

  return (
    <div>
      <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 900 }}>
        <span style={{ color: "var(--cr-red)" }}>League</span> Stats
      </h1>
      <p style={{ margin: "0 0 24px", color: "var(--cr-text-muted)", fontSize: 15 }}>
        Charts, graphs, and deep dives into the numbers.
      </p>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--cr-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Season
          </label>
          <select
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid var(--cr-border)",
              fontSize: 14,
              background: "#fff",
              color: "var(--cr-text)",
            }}
          >
            <option>2025</option>
            <option>2024</option>
            <option>2023</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--cr-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Team
          </label>
          <select
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid var(--cr-border)",
              fontSize: 14,
              background: "#fff",
              color: "var(--cr-text)",
            }}
          >
            <option>All teams</option>
          </select>
        </div>
      </div>

      {/* Placeholder chart cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 16,
        }}
      >
        {chartCards.map((card) => (
          <div
            key={card.title}
            style={{
              background: "var(--cr-surface)",
              border: "1px solid var(--cr-border)",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>{card.title}</div>
            <div style={{ fontSize: 13, color: "var(--cr-text-muted)", marginBottom: 20 }}>
              {card.desc}
            </div>
            <div
              style={{
                height: 140,
                background: "rgba(0,0,0,0.04)",
                borderRadius: 8,
                display: "grid",
                placeItems: "center",
                color: "var(--cr-text-muted)",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Coming soon
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
