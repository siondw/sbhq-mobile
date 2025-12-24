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

## Never deviate from the domain logic unless instructed.

# Avoid AI SLOP in this repo!

1. Avoid adding extra comments that a human wouldnt add. The code should be self-dcoumenting through proper naming and readability. Dont add comments that are inconsistnet with the rest of the file
2. Avoid extra defensive checks and try catches thata re abnormal for that are of the codebase. Ecspecially if called in a trusted / validated code path
3. Avoid castst to any to get around type issues

# SBHQ Player App – Code Guidelines

These are the standards and conventions for writing code in this repository.
The goal: **clean, predictable, testable, and maintainable code** across all features.

---

# 1. Folder Responsibility Rules

### `src/db/`

- Only place that imports **Supabase**.
- Only place that defines **DB row types, DB setup, and DB operations**.
- No React, no UI components, no navigation.

### `src/logic/`

- Contains game logic & state hooks, organized into two categories:

  **`src/logic/hooks/`**
  - All React hooks (useAuth, useContestState, useContests, etc.)
  - Orchestrate subscriptions, fetches, loading/error states
  - Call pure logic functions from domain folders to derive final state
  - Can depend on `db/` and on pure functions in `logic/<domain>/`
  - Cannot import from `ui/` or `screens/`

  **`src/logic/<domain>/`** (e.g., contest/, player/)
  - Pure domain logic functions (no React)
  - Player state rules, round progression logic
  - Reusable utilities for domain calculations
  - No side effects, no hooks, no React imports

- Examples:
  - `logic/hooks/useAuth.ts` - React hook for authentication
  - `logic/hooks/useContestState.ts` - React hook for contest state
  - `logic/contest/derivePlayerState.ts` - Pure function to derive player state
  - `logic/constants.ts` - Domain constants

### `src/ui/`

- All reusable React Native UI components.
- Pure visual layer.
- No DB access.
- No logic hooks (e.g. Header receives user as prop instead of calling useAuth).
- Minimal business logic (props in → render out).

### `src/screens/`

- Actual pages shown to the user.
- Use hooks from `logic/` and components from `ui/`.
- Handles navigation (Expo Router).
- Should be thin: no DB calls or deep logic.

### `src/configs/`

- Environment variables.
- Constants (SCREAMING_SNAKE_CASE).
- Route constants.
- Shared configuration values.

### `src/utils/`

- Pure helper functions.
- No Supabase imports, no React imports.
- Reusable simple utilities.

### `app/`

- Expo Router entrypoints.
- Very thin wrappers that call `screens/`.

---

# 2. TypeScript Rules

### ✔ Strict Types Only

- No `any` unless documented and isolated in a helper.
- Prefer `type` aliases over `interface` unless extending is required.

### ✔ Separate DB row types vs app domain types

- Example:
  - `ContestRow` = raw DB shape
  - `Contest` = cleaned/derived version used in logic/UI

### ✔ Null safety

- Always handle `undefined | null` explicitly.
- Never assume Supabase returns non-null rows.

---

# 3. Supabase + Data Layer Rules

### ✔ All DB actions go through `src/db/`

- Never call `.from()` or `.rpc()` in screens or hooks directly.

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

- Wrap subscribe/unsubscribe in a helper.
- Ensure old subscriptions terminate when IDs change.

### ✔ Handle errors explicitly

- Log in `db/`
- Surface usable error messages via `logic` hooks

---

# 4. Game Logic & Feature Logic Rules

### ✔ One source of truth for player state

- Implement a clear player-state resolver:
  - `ANSWERING`
  - `SUBMITTED_WAITING`
  - `CORRECT_WAITING_NEXT`
  - `ELIMINATED`
  - `WINNER`
  - etc.

- Defined as an **enum or union** in `logic/constants.ts` or `logic/playerState.ts`.

### ✔ Pure logic lives outside hooks in domain folders

- All logic evaluating contest status, elimination, correctness, etc. should be pure functions in `logic/<domain>/`
- Hooks in `logic/hooks/` call pure functions, not the other way around.
- Example: `derivePlayerState(contest, participant, question, answer)` in `logic/contest/derivePlayerState.ts`

### ✔ Hooks orchestrate in `logic/hooks/`:

- Subscriptions
- Fetches
- Local loading/error state
- Calling pure logic from domain folders to derive final player/UI state

---

# 5. UI Rules

### ✔ All UI components belong in `src/ui/`

- No DB logic.
- No logic hooks (receive data via props instead).
- No complicated conditional state (push logic to hooks).

### ✔ Minimize container nesting

- **Fewer containers, better cohesion**: Avoid 5+ nested Views in a single component.
- Each container should serve a clear structural purpose (layout, spacing, scroll).
- Don't wrap content in redundant Views - use flex properties on existing containers.
- **Avoid unnecessary filled/styled containers**: Don't add background colors, borders, or padding to intermediate containers unless they serve a clear visual purpose. Let content breathe.
- Keep component trees flat and readable.

### ✔ Color usage patterns

- **BACKGROUND**: Main champagne background for all screens
- **SURFACE**: Warm off-white for cards and elevated containers
- **PRIMARY/PRIMARY_DARK**: Main brand colors for buttons, links, emphasis
- **GRADIENT_START/GRADIENT_END**: Use for high-impact elements (hero text, important CTAs)
- **ACCENT**: Terracotta for secondary actions, warnings, highlights
- **TEXT**: Default text color
- **MUTED**: Secondary text, metadata, labels
- **Avoid pure white (#FFFFFF)**: Use SURFACE instead for better cohesion with champagne background

### ✔ Typography hierarchy

- **Title (24px, bold)**: Page headers, main section titles
- **Subtitle (18px, bold)**: Card titles, secondary headers
- **Body (16px, regular)**: Primary content, descriptions
- **Small (14px, regular/medium)**: Metadata, labels, helper text
- **Use weight prop on Text component**: "regular", "medium", "semibold", "bold"
- **Letter spacing**: Use sparingly for uppercase labels (0.3-0.5) or large display text

### ✔ Spacing consistency

- Use theme tokens (SPACING.XS, SM, MD, LG, XL, XXL) - never hardcode pixels
- **Card gaps**: SPACING.XS for tight internal spacing
- **Section gaps**: SPACING.MD for list items, card grids
- **Page padding**: SPACING.MD horizontal, SPACING.XXL bottom for scroll content
- **Button margins**: SPACING.SM top margin for separation from content

### ✔ Data formatting standards

- **Dates**: Use concise format like "11/27 @ 8PM EST" not verbose date strings
- **Money**: "$10.00" or "Free" (not "Free entry")
- **Labels**: Use "Title: Value" format for metadata lists
- **Status indicators**: Minimal badges with subtle backgrounds, not solid colors
- **Round numbers**: "Round: 3" not "Current round: 3"

### ✔ Interactive states

- **Disabled buttons**: Reduce opacity or use muted colors, show clear visual feedback
- **Locked states**: Apply opacity: 0.6 to entire card/component
- **Live indicators**: Subtle backgrounds with border, small dot, colored text (not solid backgrounds)
- **Press states**: Use native Pressable with subtle opacity changes

### ✔ Reusability and consistency

- Typography, spacing, colors should come from theme tokens.
- Common patterns (buttons, cards, banners) all use shared primitives.

### ✔ Keep screens thin

- Screens just:
  - call hooks,
  - grab returned state,
  - select which UI component to render,
  - manage navigation.

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

- Always reference constants from `constants.ts`.
- Never inline `"WINNER"`, `"SUBMITTED_WAITING"`, `"lobby_open"`, etc.

---

# 7. Naming Conventions

### ✔ Files

- Screen components: `SomethingScreen.tsx`
- Hooks: `useSomething.ts`
- DB modules: `something.ts`
- UI components: `SomethingCard.tsx`, `SomethingRow.tsx`, `SomethingBanner.tsx`

### ✔ Variables

- Use descriptive names:
  - `contestId`, `participantId`, not `cid`, `pid`

- Avoid single-letter variable names except in small functional contexts.

---

# 8. Error & Loading States

### ✔ Every hook that fetches data must expose:

- `loading` (boolean)
- `error` (Error | null)
- `data` (typed)

### ✔ Screens handle the visual part

- Show loader when `loading` is true.
- Show fallback UI when `error` exists.

---

# 9. Cleanup & Memory Safety

### ✔ All listeners/subscriptions must return cleanup functions

### ✔ Never leave a subscription open after a change in contestId/userId

### ✔ Clear intervals/timeouts in hooks using `return () => clearInterval(x)`

---

# 10. No Admin Logic

### ✔ This repo must never:

- Start contests
- Create questions
- Set correct answers
- Advance rounds
- Modify contest states manually

Admin logic belongs in a **completely separate codebase**.

---

# 11. Tooling Hygiene

### ✔ ESLint + Prettier mandatory

- No committing lint errors.
- Consistent formatting across the repo.

### ✔ Minimal console.logs

- Logs allowed for debugging.
- Remove before merging to main or wrap in a `logger` util with debug flag.

---

If you want, I can also generate a **template folder structure** with stub README files in each folder so the repo is perfectly self-documenting from day one.
