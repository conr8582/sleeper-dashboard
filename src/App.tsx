import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomeLayout } from "./components/HomeLayout";
import { HomePage } from "./pages/HomePage";
import { TeamsPage } from "./pages/TeamsPage";
import { TeamPage } from "./pages/TeamPage";
import { WeeksPage } from "./pages/WeeksPage";
import { SeasonsPage } from "./pages/SeasonsPage";
import { MatchupCalculatorPage } from "./pages/MatchupCalculatorPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home: no top nav */}
        <Route element={<HomeLayout />}>
          <Route index element={<HomePage />} />
        </Route>

        {/* Other pages: keep top nav */}
        <Route element={<Layout />}>
          {/* Teams */}
          <Route path="teams" element={<TeamsPage />} />
          <Route path="teams/:teamKey" element={<TeamPage />} />

          {/* Main sections */}
          <Route path="weeks" element={<WeeksPage />} />
          <Route path="seasons" element={<SeasonsPage />} />

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
