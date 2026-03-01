import { Outlet, Link } from "react-router-dom";
import { Nav } from "./Nav";

export function Layout() {
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Link
          to="/"
          style={{
            fontWeight: 800,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          Crumpin
        </Link>

        <Nav />
      </header>

      <main style={{ marginTop: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
