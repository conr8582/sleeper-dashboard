const AWARDS = [
  { icon: "🏆", title: "League Champion", desc: "Winner of the championship." },
  { icon: "💥", title: "Most Points (Season)", desc: "Highest total points in a regular season." },
  { icon: "💀", title: "Biggest Blowout", desc: "Largest margin of victory in a single week." },
  { icon: "😬", title: "Closest Game", desc: "Smallest margin of victory." },
  { icon: "🔥", title: "Highest Single Week", desc: "Most points scored in a single week." },
  { icon: "🚽", title: "Toilet Bowl", desc: "Worst record of the season." },
];

export function AwardsPage() {
  return (
    <div>
      <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 900 }}>Hall of Fame</h1>
      <p style={{ margin: "0 0 24px", color: "var(--cr-text-muted)", fontSize: 15 }}>
        Legends, records, and the moments that defined Crumpin.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {AWARDS.map((award) => (
          <div
            key={award.title}
            style={{
              background: "var(--cr-surface)",
              border: "1px solid var(--cr-border)",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>{award.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{award.title}</div>
            <div style={{ fontSize: 13, color: "var(--cr-text-muted)", marginBottom: 16 }}>
              {award.desc}
            </div>
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(0,0,0,0.04)",
                borderRadius: 8,
                fontSize: 13,
                color: "var(--cr-text-muted)",
                fontWeight: 600,
              }}
            >
              Data coming soon
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
