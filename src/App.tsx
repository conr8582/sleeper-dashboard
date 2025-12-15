import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomeLayout } from "./components/HomeLayout";
import { HomePage } from "./pages/HomePage";
import { SchedulePage } from "./pages/SchedulePage";
import { YearlyTotalsPage } from "./pages/YearlyTotalsPage";
import { TeamsPage } from "./pages/TeamsPage";
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
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="yearly-totals" element={<YearlyTotalsPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="matchup-calculator" element={<MatchupCalculatorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
