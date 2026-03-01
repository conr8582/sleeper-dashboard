import { Link } from "react-router-dom";
import "./HomePage.css";

export function HomePage() {
  return (
    <div className="home">
      <h1 className="home-title">crumpin</h1>

      <div className="home-nav">
        <Link className="home-link" to="/teams">
          Teams
        </Link>
        <Link className="home-link" to="/seasons">
          Seasons
        </Link>
        <Link className="home-link" to="/weeks">
          Weeks
        </Link>
      </div>
    </div>
  );
}
