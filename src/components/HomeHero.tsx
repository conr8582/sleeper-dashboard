import { Link } from "react-router-dom";

export function HomeHero() {
  return (
    <main className="metal-page">
      <section className="metal-wrap">
        <div className="metal-plaque">
          <h1 className="metal-title">CRUMPIN</h1>
        </div>

        <nav className="metal-nav" aria-label="Primary navigation">
          <Link className="metal-link" to="/schedule">
            Schedule
          </Link>
          <Link className="metal-link" to="/yearly-totals">
            Yearly Totals
          </Link>
          <Link className="metal-link" to="/teams">
            Teams
          </Link>
        </nav>
      </section>
    </main>
  );
}
