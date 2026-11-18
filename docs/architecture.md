# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep React routes and loading, empty, success, and error states in focused components under `src/components`, with all URL construction and fetch behavior centralized in `src/api/client.ts`.
- Logic tier decision: Express routes in `src/routes/api.ts` should stay thin; validate input and implement activity, team, leaderboard, and workout behavior in explicit functions in `src/services/octofitService.ts`.
- Data tier decision: Use Mongoose schemas in `src/models` for required fields and valid relationships, enforce unique normalized user emails as a stable seed key, and keep seed operations in `src/scripts/seed.ts` idempotent and non-destructive.
- Activity tracking approach: Validate activity payloads and ObjectIds in the service, verify that the referenced user and team exist, return `400` or `404` for invalid requests, and derive `points` from `minutes`.
- Team management approach: Require a non-empty name and mascot, default members to an empty array, and validate that every supplied member id is a valid ObjectId.
- Leaderboard approach: Aggregate activity points by team in the service, sort descending, and assign a 1-based rank to each team in the returned leaderboard.
- Workout suggestions approach: Match the user by email, consider recent activity and fitness goal to select a focus, return a matching workout with an explanatory reason, and return `404` for unknown users.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` - fails if model validation or idempotent seed behavior is broken.
- API command: `npm run test:api --prefix octofit-tracker/backend` - fails if route behavior, validation, references, leaderboard aggregation, or workout matching differs from the API contract.
- Frontend command: `npm test --prefix octofit-tracker/frontend` - fails if routes, API usage, loading/empty/error states, or displayed capabilities differ from the presentation contract.
- Backend build command: `npm run build --prefix octofit-tracker/backend` - fails if backend TypeScript or build configuration is invalid.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` - fails if frontend TypeScript, React, routing, or Vite integration is invalid.

## Verified baseline

- MongoDB was running on port `27017` via `mongod --dbpath /data/db`.
- Backend dependencies: `npm ci --prefix octofit-tracker/backend` completed successfully.
- Frontend dependencies: `npm ci --prefix octofit-tracker/frontend` completed successfully.
- Baseline backend: `npm test --prefix octofit-tracker/backend` passed 9/9 tests across 2 files.
- Baseline frontend: `npm test --prefix octofit-tracker/frontend` passed 15/15 tests across 1 file.
- The baseline was green rather than red in the current branch, so no additional red-failure case was present to capture.
