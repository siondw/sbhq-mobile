# docs/agent.md

# SBHQ Mobile App - Development Agent Rules

You are the development agent for the **SBHQ Mobile App (Expo React Native)**.

## Core Principles

- Follow `docs/architecture.md` exactly.
- Never introduce web-only code (DOM, CSS, CRA).
- Respect folder ownership strictly.
- Never invent features, flows, or logic without explicit user direction.
- Never deviate from domain logic unless instructed.

---

## Folder Responsibility Rules

### `src/db/`

- Only place that imports Supabase
- DB setup, row types, queries, realtime subscriptions
- No React, no UI, no navigation
- All functions return `AsyncResult<T, DbError>`

### `src/logic/`

Split into:

- **`logic/hooks/`**
  - All React hooks
  - Orchestrate fetches, subscriptions, loading/error
  - Call pure domain logic
  - May depend on `db/` and `logic/<domain>/`
  - Must not import from `ui/` or `screens/`
- **`logic/<domain>/`**
  - Pure functions only
  - No React, no hooks, no side effects

### `src/ui/`

- Reusable React Native components only
- No DB access
- No logic hooks
- Props in -> render out

### `src/screens/`

- Thin screens only
- Call hooks, render UI, handle navigation
- No DB calls, no deep logic

### `app/`

- Expo Router entrypoints
- Import screens only

### `src/utils/`

- Pure helpers
- No React, no Supabase

### `src/configs/`

- Environment values
- Route constants
- Shared configuration

Follow these folder patterns. If we are cretaing something new, ask the user where it belongs if its not obvious. Additionally, each directory and subdirectory can have its own defined types.ts, constants.ts and utils.ts that are specific to that folder. If a util/type/constant applies to two subfolders, it should be in the parent folder.

---

## Constants & Enums

- ALL constants and enums use `SCREAMING_SNAKE_CASE`
- No magic strings anywhere
- Each folder owns its own `constants.ts`

---

## Functional Programming Rules

### Result-based error handling

- No throwing in `src/db/`
- Errors must be part of the type

### Pure logic separation

- Domain logic lives outside hooks
- Hooks orchestrate, not compute

### Array utilities

- Prefer shared helpers (`groupBy`, `keyBy`, `sum`)
- Avoid manual loops and mutation

---

## Supabase Type Rules

- `as RowType` allowed only in `src/db/`
- `as unknown as Type` is never allowed
- Supabase TS warnings in `db/` are expected and acceptable

---

## Game Logic Rules

- Single source of truth for player state
- Player state defined in `logic/constants.ts`
- Hooks call pure resolvers (e.g. `derivePlayerState`)

---

## Hooks Standards

Every data hook exposes:

- `loading`
- `error`
- `data` (typed)

Hooks must:

- Clean up subscriptions
- Close listeners on ID changes
- Clear intervals/timeouts

---

## Naming Conventions

- Screens: `SomethingScreen.tsx`
- Hooks: `useSomething.ts`
- UI: `SomethingCard.tsx`
- DB: `something.ts`
- Variables: descriptive, no abbreviations

---

## No AI Slop Rules

- No unnecessary comments
- No abnormal defensive checks
- No `any` casts to bypass types
- Fix types properly or leave TODOs
- Large refactors are acceptable

---

## Forbidden in This Repo

- Admin controls
- Contest creation or advancement
- Question or answer management

---

## Tooling

- ESLint + Prettier mandatory
- No lint errors committed
- Remove debug logs before merge

---

## Required Behavior When Generating Code

- Do not violate architecture
- Explain reasoning and changes
- Favor clarity over cleverness

---

## Testing (Concise Rules)

Tests are written for humans: concise, intentional, and easy to maintain.

- Prefer high-signal tests over edge-case spam; don't retest the same thing repeatedly.
- Write long tests only for genuinely complex scenarios (flows/state machines).
- Flow tests include a short scenario comment + the expected route/screen sequence.
- Never "fudge" tests: expected outcomes must match the user-prescribed behavior.
- Favor stable assertions (route/screen sequence, key UI markers) over brittle snapshots.
- Leave production code alone by default: implement tests entirely under `tests/` unless a major test-architecture decision requires a prod change and the user explicitly confirms it.
- Test layout: use `tests/` with `tests/unit/`, `tests/flows/`, and `tests/mocks/`.

See `agent/testing.md` for the full testing strategy.
