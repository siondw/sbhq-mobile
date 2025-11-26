You are the development agent for the SBHQ Mobile App (Expo React Native).
Your responsibilities:

Follow the architecture defined in docs/CODE_GUIDELINES.md.

Use old_repo_combined_reference.txt as the only source for:

domain types

game flow logic

DB query patterns

realtime patterns

screen flows

Never bring over web-only code (DOM, CSS, CRA).

Respect folder responsibilities strictly.

All constants and enums must be SCREAMING_SNAKE_CASE.

All Supabase usage must occur ONLY inside src/db/.

All game logic must be inside src/logic/.

All UI must be inside src/ui/.

All screens must be thin and live inside src/screens/.

Router files (app/) must only import screens, nothing else.

When generating code, you MUST:

Run TypeScript type checking (npx tsc --noEmit).

Run ESLint (npx eslint src --ext .ts,.tsx).

Validate that Expo can compile (npx expo prebuild).

Ensure no code violates the architecture.

Show diffs of what changed.

Explain your reasoning referencing the guidelines and reference file.

When implementing functionality:

Always consult old_repo_combined_reference.txt for logic.

Always check the schema defined in the reference file.

Always match the original behavior exactly (unless forbidden by RN).

Never invent new features or flows.

Never deviate from the domain logic unless instructed.
---

# SBHQ Player App – Code Guidelines

These are the standards and conventions for writing code in this repository.
The goal: **clean, predictable, testable, and maintainable code** across all features.

---

# 1. Folder Responsibility Rules

### `src/db/`

* Only place that imports **Supabase**.
* Only place that defines **DB row types, DB setup, and DB operations**.
* No React, no UI components, no navigation.

### `src/logic/`

* Contains game logic & state hooks.
* Holds:

  * Player state rules
  * Round progression logic
  * Feature hooks (auth, lobby, contest)
* No UI, no JSX.
* Can depend on `db/` but not on `ui/` or `screens/`.

### `src/ui/`

* All reusable React Native UI components.
* Pure visual layer.
* No DB access.
* Minimal business logic (props in → render out).

### `src/screens/`

* Actual pages shown to the user.
* Use hooks from `logic/` and components from `ui/`.
* Handles navigation (Expo Router).
* Should be thin: no DB calls or deep logic.

### `src/configs/`

* Environment variables.
* Constants.
* Shared configuration values.

### `src/utils/`

* Pure helper functions.
* No Supabase imports, no React imports.
* Reusable simple utilities.

### `app/`

* Expo Router entrypoints.
* Very thin wrappers that call `screens/`.

---

# 2. TypeScript Rules

### ✔ Strict Types Only

* No `any` unless documented and isolated in a helper.
* Prefer `type` aliases over `interface` unless extending is required.

### ✔ Separate DB row types vs app domain types

* Example:

  * `ContestRow` = raw DB shape
  * `Contest` = cleaned/derived version used in logic/UI

### ✔ Null safety

* Always handle `undefined | null` explicitly.
* Never assume Supabase returns non-null rows.

---

# 3. Supabase + Data Layer Rules

### ✔ All DB actions go through `src/db/`

* Never call `.from()` or `.rpc()` in screens or hooks directly.

### ✔ Group DB operations by domain

Examples:

```
src/db/auth.ts
src/db/contests.ts
src/db/participants.ts
src/db/questions.ts
src/db/answers.ts
```

### ✔ Realtime subscriptions must always clean up

* Wrap subscribe/unsubscribe in a helper.
* Ensure old subscriptions terminate when IDs change.

### ✔ Handle errors explicitly

* Log in `db/`
* Surface usable error messages via `logic` hooks

---

# 4. Game Logic & Feature Logic Rules

### ✔ One source of truth for player state

* Implement a clear player-state resolver:

  * `ANSWERING`
  * `SUBMITTED_WAITING`
  * `CORRECT_WAITING_NEXT`
  * `ELIMINATED`
  * `WINNER`
  * etc.
* Defined as an **enum or union** in `logic/constants.ts` or `logic/playerState.ts`.

### ✔ Pure logic lives outside hooks

* All logic evaluating contest status, elimination, correctness, etc. should be pure functions.
* Hooks call pure functions, not the other way around.

### ✔ Hooks orchestrate:

* Subscriptions
* Fetches
* Local loading/error state
* Calling pure logic to derive final player/UI state

---

# 5. UI Rules

### ✔ All UI components belong in `src/ui/`

* No DB logic.
* No complicated conditional state (push logic to hooks).

### ✔ Reusability and consistency

* Typography, spacing, colors should come from theme tokens.
* Common patterns (buttons, cards, banners) all use shared primitives.

### ✔ Keep screens thin

* Screens just:

  * call hooks,
  * grab returned state,
  * select which UI component to render,
  * manage navigation.

---

# 6. Constants & Enums (Your Rule)

### ✔ All constants and enums MUST be SCREAMING_SNAKE_CASE

Examples:

```
export const PLAYER_STATE = {
  ANSWERING: 'ANSWERING',
  SUBMITTED_WAITING: 'SUBMITTED_WAITING',
  CORRECT_WAITING_NEXT: 'CORRECT_WAITING_NEXT',
  ELIMINATED: 'ELIMINATED',
  WINNER: 'WINNER',
} as const;
```

### ✔ Every folder that needs constants gets its own `constants.ts`

Examples:

```
src/db/constants.ts
src/logic/constants.ts
src/ui/constants.ts
src/screens/constants.ts (rare, if needed)
```

### ✔ No magic strings in logic, db, or screens

* Always reference constants from `constants.ts`.
* Never inline `"WINNER"`, `"SUBMITTED_WAITING"`, `"lobby_open"`, etc.

---

# 7. Naming Conventions

### ✔ Files

* Screen components: `SomethingScreen.tsx`
* Hooks: `useSomething.ts`
* DB modules: `something.ts`
* UI components: `SomethingCard.tsx`, `SomethingRow.tsx`, `SomethingBanner.tsx`

### ✔ Variables

* Use descriptive names:

  * `contestId`, `participantId`, not `cid`, `pid`
* Avoid single-letter variable names except in small functional contexts.

---

# 8. Error & Loading States

### ✔ Every hook that fetches data must expose:

* `loading` (boolean)
* `error` (Error | null)
* `data` (typed)

### ✔ Screens handle the visual part

* Show loader when `loading` is true.
* Show fallback UI when `error` exists.

---

# 9. Cleanup & Memory Safety

### ✔ All listeners/subscriptions must return cleanup functions

### ✔ Never leave a subscription open after a change in contestId/userId

### ✔ Clear intervals/timeouts in hooks using `return () => clearInterval(x)`

---

# 10. No Admin Logic

### ✔ This repo must never:

* Start contests
* Create questions
* Set correct answers
* Advance rounds
* Modify contest states manually

Admin logic belongs in a **completely separate codebase**.

---

# 11. Tooling Hygiene

### ✔ ESLint + Prettier mandatory

* No committing lint errors.
* Consistent formatting across the repo.

### ✔ Minimal console.logs

* Logs allowed for debugging.
* Remove before merging to main or wrap in a `logger` util with debug flag.

---

If you want, I can also generate a **template folder structure** with stub README files in each folder so the repo is perfectly self-documenting from day one.
