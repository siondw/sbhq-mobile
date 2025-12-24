Cool, that makes sense. Let’s collapse `db` + `queries` into a single folder and keep the rest simple.

Here’s an updated `ARCHITECTURE.md` you can drop straight into the repo that matches:

- `db/`
- `logic/`
- `ui/`
- `screens/`
- `configs/`
- `utils/`
- `app/` (for Expo Router)

---

# SBHQ Player App – Architecture

This doc describes how the SBHQ Player App is structured: what each folder does and how data/logic/UI fit together.

This repo is **player-only**. All admin / Game Master tools are in a separate project that talks to the same Supabase backend.

---

## 1. Stack & Scope

- **Runtime:** React Native + Expo (iOS, Android, Web via `react-native-web`)
- **Backend:** Supabase
  - Auth (Google + Email OTP)
  - Database: `users`, `contests`, `participants`, `questions`, `answers`
  - Realtime: Postgres changes

- **This app handles for a player:**
  - Login / register (Supabase auth)
  - Seeing available contests and registering
  - Lobby (Kahoot-style pregame with countdown / participants)
  - Question → Submitted → Correct / Eliminated → Winner flow

Admin controls (start game, open/close submissions, set correct answers, advance rounds) are all **external**.

---

## 2. Top-level layout

```text
app/         # Expo Router entrypoints (very thin)
src/
  db/        # Supabase client, DB types, and all DB operations
  logic/     # Game logic + feature hooks (auth, lobby, contest)
  ui/        # Reusable React Native UI components
  screens/   # Screen components (compose logic + UI)
  configs/   # Env, constants, app-wide config
  utils/     # Generic helpers (dates, formatting, etc.)
```

---

## 3. `src/db/` – Supabase + all DB access

**Goal:** One place that knows how to talk to Supabase.

This folder includes:

- **Client setup**
  - `client.ts` – initializes Supabase client using env vars.

- **Types**
  - `types.ts` – TypeScript types that mirror table shapes:
    - `UserRow`, `ContestRow`, `ParticipantRow`, `QuestionRow`, `AnswerRow`

  - Optionally generated from Supabase, or hand-written and kept in sync.

- **DB operations (reads/writes/subscriptions)**
  - You can break these into files by domain, for example:
    - `auth.ts` – login/logout helpers, get current session.
    - `contests.ts` – list contests, get contest by id, subscribe to contest updates.
    - `participants.ts` – get/create participant, subscribe to participant changes.
    - `questions.ts` – get questions, get current round question, subscribe to question changes.
    - `answers.ts` – submit answer, fetch previous answer for reconnection.

Everything that talks to Supabase lives here.

**Rules:**

- Only `db/` imports Supabase.
- No React imports in this folder.
- Other folders don’t call Supabase directly; they call functions from `db/`.

---

## 4. `src/logic/` – Game + app logic

**Goal:** Central place for **how SBHQ works** and how the app derives player state from data.

There are two flavours of logic here:

### 4.1 `src/logic/hooks/` – React hooks

React hooks that connect the data layer to the UI layer:

- `useAuth()` – Manages Supabase session, current user, login/logout flows. Returns derivedUser with id, email, role, username.
- `useContests()` – Fetches available contests list with loading/error states and refresh functionality.
- `useContestRegistration()` – Handles joining/registering for contests, tracks participant status per contest.
- `useContestState(contestId)` – Main contest flow hook that:
  - Subscribes to contest, questions, participant, answers in real-time
  - Uses pure logic from `logic/contest/` to compute player state
  - Returns what screen-state the player is in (answering/submitted/correct/eliminated/winner)
  - Provides current question/round info and `submitAnswer` callback
- `useParticipantCount(contestId)` – Tracks remaining active player count for a contest.
- `useHeaderHeight()` – Returns header height for proper content padding.

These hooks:

- Can import from `db/` and from `logic/<domain>/` pure functions
- Cannot import from `ui/` or `screens/`
- Return `{ data, loading, error, ...actions }` shape
- Handle subscription cleanup properly

### 4.2 `src/logic/<domain>/` – Pure domain logic

Pure functions organized by domain (no React, no side effects):

**`logic/contest/`**

- `derivePlayerState.ts` – Given contest/participant/question/answer data, returns player status:
  - `LOBBY`
  - `ANSWERING`
  - `SUBMITTED_WAITING`
  - `CORRECT_WAITING_NEXT`
  - `ELIMINATED`
  - `WINNER`
- `contestUtils.ts` – Contest-related calculations and helpers

**`logic/constants.ts`**

- Domain-level constants (SCREAMING_SNAKE_CASE)

These functions:

- Take data as parameters, return computed results
- No React imports, no hooks, no `useState/useEffect`
- Can be tested in isolation
- Used by hooks in `logic/hooks/`

**Rules:**

- `logic/hooks/` imports from `db/` and `logic/<domain>/`
- `logic/<domain>/` should not import from `logic/hooks/` (one-way dependency)
- Screens/UI never import pure logic directly - they use hooks from `logic/hooks/`
- It's the "brain" of the app that the screens will use.

---

## 5. `src/ui/` – Reusable visual components

**Goal:** All the React Native building blocks for your interface.

Examples:

- Primitives:
  - `Button`
  - `Text`
  - `Card`
  - `LoadingSpinner`
  - Layout wrappers (e.g. `ScreenContainer`)

- SBHQ-specific UI components:
  - `QuestionCard`
  - `AnswerOption`
  - `LobbyHeader`
  - `CountdownDisplay`
  - `StatusBanner` (for correct/eliminated/winner states)

These components:

- Receive data + callbacks via props.
- Do not make DB calls.
- Do not use logic hooks directly (e.g. Header receives user prop instead of calling useAuth).
- Do not own navigation.

You can organize them however you like, e.g.:

```text
src/ui/
  primitives/
  lobby/
  contest/
  common/
```

---

## 6. `src/screens/` – Screens (actual pages in the app)

**Goal:** Components that represent entire screens and are hooked into navigation.

Expected screens:

- `LoginScreen` – uses `logic/useAuth`, shows login options.
- `ContestListScreen` – shows available contests from `db/`/`logic`.
- `LobbyScreen` – shows pregame/lobby state with countdown & participants.
- `GameScreen` – main in-contest screen that:
  - renders Question / Submitted / Correct / Eliminated / Winner states based on `useContestState`.

- `WinnerScreen` (optional) – separate screen for final winner celebration if you don’t just handle it inside `GameScreen`.

Screens:

- Use hooks from `logic/` to pull in state and actions.
- Use components from `ui/` to render.
- Handle navigation decisions (e.g., when to redirect to lobby, when to go back to contest list, etc.).

---

## 7. `src/configs/` – Config and environment

**Goal:** Centralized config.

Examples:

- `env.ts`:
  - Reads Supabase URL & anon key from Expo env vars:
    - `EXPO_PUBLIC_SUPABASE_URL`
    - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

- Any other app-wide constants:
  - default contest id for dev
  - timeouts, feature flags, etc.

This keeps environment details out of `logic/` and `db/` files.

---

## 8. `src/utils/` – Generic helpers

**Goal:** Small, stateless helpers.

Examples:

- Date formatting: `formatCountdown`, `formatTimeRemaining`.
- String helpers.
- Simple pure utility functions that don’t belong in `logic/`.

Should not reference React or Supabase directly.

---

## 9. `app/` – Expo Router entrypoints

Expo Router uses `app/` as the route map.

Pattern:

- Files in `app/` are thin wrappers that import from `src/screens/`.

Example:

```text
app/
  index.tsx               → mounts LoginScreen / ContestListScreen
  lobby/
    index.tsx             → mounts LobbyScreen
  contest/
    [contestId].tsx       → mounts GameScreen
  winner/
    index.tsx             → mounts WinnerScreen (if separate)
```

These files:

- Do minimal work: mostly `<ScreenComponent />` plus route params.
- No Supabase logic here.

---

### Summary

- **Data layer** = `db/`
- **React hooks** = `logic/hooks/`
- **Pure domain logic** = `logic/<domain>/`
- **Visual pieces** = `ui/`
- **Actual pages** = `screens/`
- **Routing** = `app/`
- **Env/consts** = `configs/`
- **Helpers** = `utils/`

You always know where to go:

- "How do I fetch contests?" → `src/db/contests.ts`
- "How do I use contests in a screen?" → `src/logic/hooks/useContests.ts`
- "How do I decide if a player is eliminated?" → `src/logic/contest/derivePlayerState.ts`
- "Where's the question UI?" → `src/ui/primitives/AnswerOption.tsx` and `src/screens/GameScreen.tsx`
- "What routes exist?" → `src/configs/routes.ts`

If you want, next step we can write a tiny README stub for each folder (`src/db/README.md`, `src/logic/README.md`, etc.) so the structure is self-documenting when someone opens it in VS Code.
