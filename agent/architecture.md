# SBHQ Player App – Architecture

This document describes **how the SBHQ Player App is structured** and how data, logic, and UI flow through the system.

This repository is **player-only**.  
All admin / Game Master functionality lives in a **separate project** that talks to the same Supabase backend.

---

## 1. Stack & Scope

### Tech Stack

- **Runtime:** React Native + Expo
- **Routing:** Expo Router
- **Backend:** Supabase
  - Auth (Google, Email OTP)
  - Database (users, contests, participants, questions, answers)
  - Realtime (Postgres changes)

### Scope of This App

This app handles everything a **player** can do:

- Authenticate
- View and register for contests
- Participate in live contests
- Submit answers
- See outcomes (correct / eliminated / winner)

It does **not**:

- Start contests
- Create or edit questions
- Set correct answers
- Advance rounds

---

## 2. High-Level Architecture

The app is structured into clear layers:

```

Supabase (DB + Realtime)
↓
src/db        → data access only
↓
src/logic       → hooks + pure domain logic
↓
src/screens    → screen composition
↓
src/ui       → visual components

```

Each layer has a **single responsibility** and depends only on layers below it.

---

## 3. Top-Level Layout

```text
app/         # Expo Router entrypoints (very thin)
src/
  db/        # Supabase client, DB types, DB operations
  logic/     # App logic (hooks + pure domain logic)
  ui/        # Reusable UI components & theme system
  screens/   # Screen-level components
  configs/   # Env + app-wide configuration
  utils/     # Generic pure helpers
```

---

## 4. `src/db/` – Data Layer

**Purpose:** One place that knows how to talk to Supabase.

### Responsibilities

- Supabase client initialization
- Database row types
- Reads, writes, and realtime subscriptions

### Typical Files

- `client.ts` – Supabase client setup
- `types.ts` – Row types (`ContestRow`, `ParticipantRow`, etc.)
- Domain modules:
  - `auth.ts`
  - `contests.ts`
  - `participants.ts`
  - `questions.ts`
  - `answers.ts`

### Key Idea

Other parts of the app **never call Supabase directly**.
They call functions from `src/db/`.

---

## 5. `src/logic/` – App & Game Logic

This is the **brain** of the app.

### 5.1 `logic/hooks/` – React hooks

Hooks connect the data layer to the UI:

Examples:

- `useAuth()`
- `useContests()`
- `useContestRegistration()`
- `useContestState(contestId)`
- `useParticipantCount(contestId)`

Responsibilities:

- Fetch data
- Manage realtime subscriptions
- Track loading/error state
- Call pure domain logic to derive player state

Hooks return shaped state + actions for screens to consume.

---

### 5.2 `logic/<domain>/` – Pure domain logic

Pure, testable functions with **no React and no side effects**.

Example domains:

- `logic/contest/`
  - `derivePlayerState(...)`
  - Contest-related helpers

- `logic/constants.ts`
  - Domain-level enums and constants

These functions:

- Take data as input
- Return computed results
- Are used by hooks in `logic/hooks/`

---

## 6. `src/ui/` – Visual System

**Purpose:** All reusable visual building blocks.

Subfolders:

- `components/` – Buttons, cards, headers, etc.
- `animations/` – Shared animation hooks and presets
- `textures/` – Visual effects (glassy, shine, etc.)
- `theme/` – Colors, spacing, typography, theme context

UI components:

- Receive data via props
- Do not fetch data
- Do not own navigation
- Do not contain business logic

---

## 7. `src/screens/` – Screens

Screens represent **full pages** in the app.

Examples:

- `LoginScreen`
- `ContestListScreen`
- `LobbyScreen`
- `GameScreen`
- `WinnerScreen` (optional)

Screens:

- Call hooks from `logic/`
- Render UI from `ui/`
- Handle navigation decisions
- Remain intentionally thin

---

## 8. `src/configs/` – Configuration

Centralized app configuration:

- Environment variables
- App-wide constants
- Feature flags
- Theme selection

Keeps config out of logic and UI.

---

## 9. `src/utils/` – Generic Helpers

Small, stateless helpers:

- Date/time formatting
- String helpers
- Simple math utilities

No React. No Supabase.

---

## 10. `app/` – Expo Router

Expo Router uses `app/` as the route map.

Pattern:

```text
app/
  index.tsx
  lobby/
    index.tsx
  contest/
    [contestId].tsx
```

Files in `app/`:

- Are extremely thin
- Import screens from `src/screens/`
- Pass route params
- Do not contain logic or DB access

---

## 11. How to Navigate the Codebase

- “How do I fetch contests?”
  → `src/db/contests.ts`

- “How does contest state work?”
  → `src/logic/hooks/useContestState.ts`
  → `src/logic/contest/derivePlayerState.ts`

- “Where is this UI built?”
  → `src/ui/components/`

- “Which screen am I on?”
  → `src/screens/`

- “Where are routes defined?”
  → `app/`

---

## Summary

- **Data access** → `src/db/`
- **Hooks** → `src/logic/hooks/`
- **Pure logic** → `src/logic/<domain>/`
- **UI system** → `src/ui/`
- **Screens** → `src/screens/`
- **Routing** → `app/`
- **Config** → `src/configs/`
- **Helpers** → `src/utils/`
