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

Run TypeScript type checking (npm run tsc).

Run ESLint (npm run lint or npm run lint:fix for auto-fixes).

Run Prettier formatting (npm run format).

Ensure no code violates the architecture.

Show diffs of what changed.

Explain your reasoning referencing the guidelines and reference file.

## Available npm scripts:

- `npm start` – Start Expo dev server
- `npm run start:tunnel` – Start Expo with tunnel and go flag
- `npm run android` – Run on Android device/emulator
- `npm run ios` – Run on iOS device/simulator
- `npm run web` – Run web version
- `npm run tsc` – TypeScript type checking (no emit)
- `npm run lint` – Run ESLint
- `npm run lint:fix` – Run ESLint with auto-fix
- `npm run format` – Format all files with Prettier
- `npm run format:check` – Check formatting without making changes

When implementing functionality:

Always consult old_repo_combined_reference.txt for logic.

Always check the schema defined in the reference file.

Always match the original behavior exactly (unless forbidden by RN).

Never invent new features or flows.

## Never deviate from the domain logic unless instructed.

# Avoid AI SLOP in this repo!

1. Avoid adding extra comments that a human wouldnt add. The code should be self-dcoumenting through proper naming and readability. Dont add comments that are inconsistnet with the rest of the file
2. Avoid extra defensive checks and try catches thata re abnormal for that are of the codebase. Ecspecially if called in a trusted / validated code path
3. Avoid casts to any to get around type issues
4. NEVER use `as unknown as Type` or similar cheap shortcuts to bypass type errors - fix them properly or leave them to address later

# Functional Programming Patterns

This codebase follows functional TypeScript patterns for better type safety and maintainability:

## 1. Result Type for Explicit Error Handling

All `src/db/` functions return `AsyncResult<T, DbError>` instead of throwing:

```typescript
// Good - Error is part of the type
export const getUser = async (id: string): AsyncResult<User, DbError> => {
  const { data, error } = await SUPABASE_CLIENT.from('users')...
  if (error) {
    return Err(networkError(error.message));
  }
  return Ok(data);
};

// Bad - Error is hidden, can be forgotten
export const getUser = async (id: string): Promise<User> => {
  const { data, error } = await SUPABASE_CLIENT.from('users')...
  if (error) {
    throw new Error(error.message); // ❌ Not in type signature
  }
  return data;
};
```

**Hooks handle Results explicitly:**

```typescript
const fetchData = async () => {
  const result = await getUser(userId);
  if (result.ok) {
    setUser(result.value);
  } else {
    setError(getErrorMessage(result.error));
  }
};
```

## 2. Pure Logic Separation

- **Pure functions** in `src/logic/<domain>/` - No React, no side effects
- **Effect hooks** in `src/logic/hooks/` - Call pure functions, manage subscriptions
- **DB operations** in `src/db/` - Isolated side effects

Example:

```typescript
// src/logic/contest/derivePlayerState.ts - Pure
export const derivePlayerState = (
  contest: ContestRow | null,
  participant: ParticipantRow | null,
  question: QuestionRow | null,
  answer: AnswerRow | null,
): PlayerState => {
  // Pure computation, no side effects
};

// src/logic/hooks/useContestState.ts - Uses pure function
const playerState = useMemo(
  () => derivePlayerState(contest, participant, question, answer),
  [contest, participant, question, answer],
);
```

## 3. Array Utilities for Composition

Use `groupBy`, `keyBy`, `sum` from `src/utils/array.ts`:

```typescript
// Good
const byContest = groupBy(participants, (p) => p.contest_id);
const byId = keyBy(users, (u) => u.id);

// Avoid
const byContest = {};
for (const p of participants) {
  if (!byContest[p.contest_id]) byContest[p.contest_id] = [];
  byContest[p.contest_id].push(p);
}
```

## 4. Supabase Type Assertions

Supabase's complex type inference system generates verbose generic types that TypeScript struggles to reconcile with application types. The `as RowType` pattern is the **standard practice** recommended by the Supabase community for bridging this gap.

```typescript
// ✅ Good - Direct type assertion (recommended pattern)
const { data, error } = await SUPABASE_CLIENT.from('contests').select('*').single();

if (error) return Err(networkError(error.message));
return Ok(data as ContestRow); // Standard Supabase pattern

// ❌ Bad - Using 'as unknown as' is a code smell
return Ok(data as unknown as ContestRow); // Avoid this
```

**Expected TypeScript Warnings:**
Type errors like `"Conversion of type 'GetResult<...>' may be a mistake"` are **expected** in `src/db/` files. These are false positives from TypeScript's strict checks and can be safely ignored:

```typescript
// These warnings are EXPECTED and acceptable:
src/db/answers.ts(55,15): error TS2352: Conversion of type '...' to type 'AnswerRow' may be a mistake
src/db/contests.ts(23,12): error TS2352: Conversion of type '...' to type 'ContestRow[]' may be a mistake
```

**Why this happens:**

- Supabase generates complex `GetResult<QueryResult<...>>` types
- These types encode the full query structure but don't match our simpler `RowType` interfaces
- The `as RowType` cast is safe because our types match the database schema
- This is documented in Supabase's TypeScript guide and community patterns

**Rule:** Only use `as RowType` casts in `src/db/` files. Never use `as unknown as Type`.

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

The `src/ui/` folder is organized into specialized subfolders:

- **`src/ui/components/`** – React Native components (Button, Card, Text, etc.)
- **`src/ui/animations/`** – Reusable animation hooks and presets
- **`src/ui/textures/`** – Visual texture effects (GlassyTexture, etc.)
- **`src/ui/theme/`** – Theme system (colors, spacing, typography, utilities)

**Rules:**

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

### ✔ Reusability and abstraction

**Core Principle:** If the user mentions they will use something more than once, ALWAYS abstract it into a reusable component, hook, or utility.

- Typography, spacing, colors should come from theme tokens.
- Common patterns (buttons, cards, banners) all use shared primitives.
- **Animations:** Use reusable hooks from `src/ui/animations/`:
  - `usePulseAnimation(duration)` for pulsing effects
  - `useShineAnimation(options)` for shine/shimmer effects
  - All animations use centralized constants and presets for consistency
- **Visual effects:** Use reusable texture components from `src/ui/textures/`:
  - `GlassyTexture` for glassy 3D effects with gradient overlays and shine
  - Configurable intensity presets (SUBTLE, NORMAL, DRAMATIC)
- **When to abstract:**
  - User explicitly says "I'll use this in multiple places"
  - User mentions wanting consistent styling/behavior across components
  - You notice duplicate patterns emerging (e.g., same gradient/animation logic)
  - The pattern is complex enough to warrant abstraction (e.g., multi-layer effects)
- **How to abstract:**
  - Animations → Create hook in `src/ui/animations/`
  - Visual effects → Create component in `src/ui/textures/`
  - Logic → Create hook in `src/logic/hooks/` or pure function in `src/logic/<domain>/`
  - UI patterns → Create component in `src/ui/components/`
  - Always define types in a separate `types.ts` file within the module
  - Export through barrel `index.ts` for clean imports

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
