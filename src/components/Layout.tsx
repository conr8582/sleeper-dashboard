import { Outlet, Link } from "react-router-dom";
import { Nav } from "./Nav";

export function Layout() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--cr-bg)" }}>
      <header
        style={{
          background: "var(--cr-header-bg)",
          borderBottom: "2px solid var(--cr-red)",
          color: "var(--cr-header-text)",
        }}
      >
        <div
          style={{
            maxWidth: 1024,
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: 56,
            gap: 16,
          }}
        >
          <Link
            to="/"
            style={{
              fontWeight: 900,
              fontSize: 20,
              textDecoration: "none",
              letterSpacing: "0.01em",
              flexShrink: 0,
            }}
          >
            <span style={{ color: "var(--cr-red)" }}>CRUM</span>
            <span style={{ color: "var(--cr-blue)" }}>PIN</span>
          </Link>

          <Nav />
        </div>
      </header>

      <main style={{ maxWidth: 1024, margin: "0 auto", padding: "24px 20px" }}>
        <Outlet />
      </main>
    </div>
  );
}
