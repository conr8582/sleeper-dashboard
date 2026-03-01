import React from "react";
import { NavLink } from "react-router-dom";

const baseLinkStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  textDecoration: "none",
};

function linkStyle(isActive: boolean): React.CSSProperties {
  return {
    ...baseLinkStyle,
    fontWeight: isActive ? 700 : 500,
    background: isActive ? "#eee" : "transparent",
    color: "inherit",
  };
}

export function Nav() {
  return (
    <nav style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <NavLink to="/" end style={({ isActive }) => linkStyle(isActive)}>
        Home
      </NavLink>

      <NavLink to="/teams" style={({ isActive }) => linkStyle(isActive)}>
        Teams
      </NavLink>

      <NavLink to="/seasons" style={({ isActive }) => linkStyle(isActive)}>
        Seasons
      </NavLink>

      <NavLink to="/weeks" style={({ isActive }) => linkStyle(isActive)}>
        Weeks
      </NavLink>

      <span style={{ opacity: 0.35, margin: "0 4px" }}>|</span>

      <NavLink to="/matchup-calculator" style={({ isActive }) => linkStyle(isActive)}>
        Matchup Calculator
      </NavLink>
    </nav>
  );
}
