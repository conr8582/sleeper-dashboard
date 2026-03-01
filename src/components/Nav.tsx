import React from "react";
import { NavLink } from "react-router-dom";

function linkStyle(isActive: boolean): React.CSSProperties {
  return {
    padding: "4px 0",
    textDecoration: "none",
    color: "var(--cr-header-text)",
    fontWeight: isActive ? 700 : 500,
    fontSize: 14,
    borderBottom: isActive ? "2px solid var(--cr-red)" : "2px solid transparent",
    whiteSpace: "nowrap",
  };
}

export function Nav() {
  return (
    <nav style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
      <NavLink to="/teams" style={({ isActive }) => linkStyle(isActive)}>
        Teams
      </NavLink>

      <NavLink to="/seasons" style={({ isActive }) => linkStyle(isActive)}>
        Seasons
      </NavLink>

      <NavLink to="/stats" style={({ isActive }) => linkStyle(isActive)}>
        Stats
      </NavLink>

      <NavLink to="/awards" style={({ isActive }) => linkStyle(isActive)}>
        Awards
      </NavLink>

      <NavLink to="/matchup-calculator" style={({ isActive }) => linkStyle(isActive)}>
        Matchup Calc
      </NavLink>
    </nav>
  );
}
