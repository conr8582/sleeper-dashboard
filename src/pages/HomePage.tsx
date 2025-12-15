import { Link } from "react-router-dom";
import "./HomePage.css";

export function HomePage() {
  return (
    <div className="home">
      <h1 className="home-title">crumpin</h1>

      <div className="home-nav">
        <Link className="home-link" to="/schedule">
          Schedule
        </Link>
        <Link className="home-link" to="/yearly-totals">
          Yearly Totals
        </Link>
        <Link className="home-link" to="/teams">
          Teams
        </Link>
      </div>
    </div>
  );
}
