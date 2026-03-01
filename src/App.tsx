import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { TeamsPage } from "./pages/TeamsPage";
import { TeamPage } from "./pages/TeamPage";
import { WeeksPage } from "./pages/WeeksPage";
import { SeasonsPage } from "./pages/SeasonsPage";
import { MatchupCalculatorPage } from "./pages/MatchupCalculatorPage";
import { StatsPage } from "./pages/StatsPage";
import { AwardsPage } from "./pages/AwardsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />

          {/* Teams */}
          <Route path="teams" element={<TeamsPage />} />
          <Route path="teams/:teamKey" element={<TeamPage />} />

          {/* Main sections */}
          <Route path="weeks" element={<WeeksPage />} />
          <Route path="seasons" element={<SeasonsPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="awards" element={<AwardsPage />} />

          {/* Old routes → redirects */}
          <Route path="schedule" element={<Navigate to="/weeks" replace />} />
          <Route
            path="yearly-totals"
            element={<Navigate to="/seasons" replace />}
          />

          {/* Tools */}
          <Route path="matchup-calculator" element={<MatchupCalculatorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
