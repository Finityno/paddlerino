# Paddlerino

Paddlerino is a match session tracker for padel-style games. It helps a group run a match day by creating a match, adding players, running one live session at a time, recording scores quickly, and maintaining a leaderboard across completed sessions.

## Product

### What users can do

- Create a new match from the home page.
- Open a match and add/remove players.
- Start a new session with a selected subset of players (minimum 2 in UI).
- Update live scores with quick buttons (`+1`, `+2`, `+3`, `-1`) or direct numeric input.
- End a session and keep it in session history.
- Share the match link with others.
- See a live leaderboard that updates based on completed sessions.

### Scoring and ranking rules

- Only one session can be `in_progress` per match at a time.
- Scores are clamped to non-negative integers.
- Leaderboard is based on completed sessions only.
- Session winner logic:
  - Highest score must be greater than `0`.
  - Winner must be unique (ties do not award a win).
- Leaderboard sorting:
  - `wins` (desc), then `totalPoints` (desc), then `sessionsPlayed` (desc).

### Current behavior to know

- Authentication is required for creating/editing match data.
- A player cannot be removed once they have any session score records.
- Matches are created with status `active`. There is currently no "complete match" flow in the UI.

## Technical Implementation

### Stack

- **Monorepo:** Turborepo + Bun workspaces
- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn-style components
- **Backend:** Convex (queries/mutations + reactive data)
- **Auth:** Better Auth integrated with Convex (`@convex-dev/better-auth`)
- **UX details:** optimistic score updates for live session editing

### Architecture

- `apps/web` contains the web app (`/` for match list, `/match/[id]` for match operations).
- `packages/backend/convex` contains schema and backend logic:
  - `matches.ts`: list/create/get match + players
  - `players.ts`: add/remove players
  - `sessions.ts`: create/list/getActive/update/set/end sessions
  - `leaderboard.ts`: derived leaderboard aggregation
  - `schema.ts`: `matches`, `players`, `sessions`, `sessionPlayers`
- `packages/env` defines typed environment variables used by the web app.

### Data model (Convex)

- `matches`: match metadata (`name`, `createdBy`, `status`, `createdAt`)
- `players`: player entries scoped to a match
- `sessions`: numbered match sessions with `in_progress`/`completed`
- `sessionPlayers`: per-session player score rows

## Local Development

### Prerequisites

- Bun `1.3+`
- A Convex account/project (created during setup)

### Setup

1. Install dependencies:

```bash
bun install
```

2. Configure Convex:

```bash
bun run dev:setup
```

3. Ensure web env has Convex public vars (copied from `packages/backend/.env.local`):

```bash
NEXT_PUBLIC_CONVEX_URL=...
NEXT_PUBLIC_CONVEX_SITE_URL=...
```

4. Start development:

```bash
bun run dev
```

Open `http://localhost:3001`.

## Scripts

- `bun run dev` - run all workspace dev processes
- `bun run build` - build all workspaces
- `bun run check-types` - typecheck all workspaces
- `bun run dev:web` - run only the web app
- `bun run dev:server` - run only Convex backend dev
- `bun run dev:setup` - configure Convex for local development
