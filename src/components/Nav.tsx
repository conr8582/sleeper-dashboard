import { NavLink } from "react-router-dom";

const baseLinkStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  textDecoration: "none",
};

export function Nav() {
  return (
    <nav style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <NavLink
        to="/"
        end
        style={({ isActive }) => ({
          ...baseLinkStyle,
          fontWeight: isActive ? 700 : 500,
          background: isActive ? "#eee" : "transparent",
          color: "inherit",
        })}
      >
        Home
      </NavLink>

      <NavLink
        to="/schedule"
        style={({ isActive }) => ({
          ...baseLinkStyle,
          fontWeight: isActive ? 700 : 500,
          background: isActive ? "#eee" : "transparent",
          color: "inherit",
        })}
      >
        Schedule
      </NavLink>

      <NavLink
        to="/yearly-totals"
        style={({ isActive }) => ({
          ...baseLinkStyle,
          fontWeight: isActive ? 700 : 500,
          background: isActive ? "#eee" : "transparent",
          color: "inherit",
        })}
      >
        Yearly Totals
      </NavLink>

      <NavLink
        to="/teams"
        style={({ isActive }) => ({
          ...baseLinkStyle,
          fontWeight: isActive ? 700 : 500,
          background: isActive ? "#eee" : "transparent",
          color: "inherit",
        })}
      >
        Teams
      </NavLink>

      <NavLink
        to="/matchup-calculator"
        style={({ isActive }) => ({
          ...baseLinkStyle,
          fontWeight: isActive ? 700 : 500,
          background: isActive ? "#eee" : "transparent",
          color: "inherit",
        })}
      >
        Matchup Calculator
      </NavLink>
    </nav>
  );
}
