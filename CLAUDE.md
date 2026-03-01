# Sleeper Dashboard

> **Living document** — update this file whenever the project structure, conventions, or key decisions change. It is loaded automatically into every Claude Code session so it provides immediate context without needing to re-explore the codebase.

A fantasy football dashboard for a specific Sleeper league, displaying team info, weekly matchups, season-long stats, and head-to-head comparisons.

## Tech Stack

- **React 19** with TypeScript
- **Vite** (build tool and dev server)
- **React Router v7** (client-side routing)
- No UI component library — all styles are inline

## Sleeper API

Base URL: `https://api.sleeper.app`

Key endpoints used:
| Endpoint | Purpose |
|---|---|
| `GET /v1/league/{leagueId}` | Fetch league metadata (season, previous_league_id, settings) |
| `GET /v1/league/{leagueId}/users` | Fetch all users in a league |
| `GET /v1/league/{leagueId}/rosters` | Fetch all rosters (includes W/L/PF/PA in `settings`) |
| `GET /v1/league/{leagueId}/matchups/{week}` | Fetch matchups for a specific week |

Avatar images: `https://sleepercdn.com/avatars/{avatarId}`

## League Constants

Defined in **`src/lib/sleeper.ts`** — the single source of truth:

```ts
export const LEAGUE_ID = "1257481742223163392";  // current season league ID
export const START_SEASON = 2023;                 // earliest season to include in history
```

The league history is a linked list: each league has a `previous_league_id` pointing to the prior season. `getLeagueHistoryFromCurrent()` walks this chain back to `START_SEASON`.

## Project Structure

```
src/
  lib/
    sleeper.ts          # Shared constants, types, and API utilities
  hooks/
    useTeams.ts         # Fetches users + rosters, returns TeamInfo[]
    useWeekMatchups.ts  # Fetches matchups for a (leagueId, week) pair
    useSeasonStats.ts   # Fetches per-season W/L/PF/PA for all rosters
  components/
    Layout.tsx          # Top-nav shell for inner pages
    HomeLayout.tsx      # Shell for the home page (no nav)
    Nav.tsx             # Navigation bar
    HomeHero.tsx        # Hero section on the home page
    TeamList.tsx        # Grid of team cards with links
    MatchupList.tsx     # Renders a list of matchup cards for a given week
  pages/
    HomePage.tsx        # Landing page
    TeamsPage.tsx       # /teams — grid of all teams
    TeamPage.tsx        # /teams/:teamKey — team detail + season history
    WeeksPage.tsx       # /weeks — season/week selector + matchup display
    SeasonsPage.tsx     # /seasons — per-season standings table
    MatchupCalculatorPage.tsx  # /matchup-calculator — head-to-head and vs-all
  App.tsx               # Router and route definitions
  main.tsx              # Entry point
```

## Dev Commands

```bash
npm run dev     # Start dev server (usually http://localhost:5173)
npm run build   # TypeScript check + production build
npm run lint    # ESLint
```

## Coding Conventions

- **Inline styles** for all component styling — no CSS files, no CSS-in-JS library
- **Custom hooks** for all data fetching (never fetch directly inside components)
- `fetchJSON<T>(url)` from `lib/sleeper` is the standard way to make API calls
- All shared types, constants, and API utilities live in `src/lib/sleeper.ts`
- `TeamList.tsx` re-exports `TeamInfo` from `lib/sleeper` for backward compatibility
- Routes use the pattern `/teams/:teamKey` where `teamKey = "{rosterId}-{slugifiedName}"`
