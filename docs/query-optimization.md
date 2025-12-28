# Query & Subscription Optimization Checklist

## Context

Optimizing data fetching and realtime subscriptions for SBHQ mobile app. Goals:

- Single source of truth for contest state across all screens
- Reduce subscription setup/teardown churn during navigation
- Cleaner architecture with screens consuming shared context

## Solution Overview

Create `ContestStateProvider` context using Expo Router's **route groups** to share a single `useContestState` instance across all contest-flow screens.

---

## Implementation Checklist

### Phase 1: Create Context Provider

- [x] Create `src/logic/contexts/` folder
- [x] Create `src/logic/contexts/ContestStateContext.tsx`
  - [x] Define `ContestStateContextValue` type (mirrors `UseContestStateResult`)
  - [x] Create React Context with `createContext<ContestStateContextValue | null>(null)`
  - [x] Create `ContestStateProvider` component that:
    - [x] Accepts `contestId` and `userId` as props
    - [x] Calls `useContestState(contestId, userId)` internally
    - [x] Provides state via Context.Provider
  - [x] Create `useContestData()` hook that:
    - [x] Calls `useContext(ContestStateContext)`
    - [x] Throws helpful error if used outside provider
  - [x] Export `ContestStateProvider` and `useContestData`
- [x] Create `src/logic/contexts/index.ts` barrel export

### Phase 2: Create Route Group & Integrate Provider

- [x] Create `app/(contest)/` route group folder
- [x] Move contest-flow routes into route group:
  - [x] `app/lobby/index.tsx` → `app/(contest)/lobby/index.tsx`
  - [x] `app/submitted/index.tsx` → `app/(contest)/submitted/index.tsx`
  - [x] `app/correct/index.tsx` → `app/(contest)/correct/index.tsx`
  - [x] `app/eliminated/index.tsx` → `app/(contest)/eliminated/index.tsx`
  - [x] `app/winner/index.tsx` → `app/(contest)/winner/index.tsx`
  - [x] `app/contest/[contestId].tsx` → `app/(contest)/game/[contestId].tsx`
- [x] Create `app/(contest)/_layout.tsx`:
  - [x] Import `ContestStateProvider` and `useAuth`
  - [x] Extract `contestId` from `useLocalSearchParams()`
  - [x] Get `userId` from `useAuth().derivedUser?.id`
  - [x] Wrap `<Slot />` with `<ContestStateProvider contestId={contestId} userId={userId}>`
  - [x] Add `<Stack>` navigator with `headerShown: false`
- [x] Update `app/_layout.tsx`:
  - [x] Remove individual contest screen Stack.Screen entries
  - [x] Route group handles its own layout

### Phase 3: Update Screens to Use Context

- [x] Update `src/screens/LobbyScreen.tsx`
  - [x] Replace `useContestState(params.contestId, derivedUser?.id)` with `useContestData()`
  - [x] Keep `useParticipantCount` as-is (separate polling hook)
  - [x] Remove `contestId` extraction from params (get from context)

- [x] Update `src/screens/GameScreen.tsx`
  - [x] Replace `useContestState()` with `useContestData()`
  - [x] Keep `useParticipantCount` as-is
  - [x] Remove `contestId` extraction from params

- [x] Update `src/screens/SubmittedScreen.tsx`
  - [x] Replace `useContestState()` with `useContestData()`
  - [x] Keep `useParticipantCount` as-is
  - [x] Keep `useAnswerDistribution` as-is (screens manage their own distribution fetching)
  - [x] Remove `contestId` extraction from params

- [x] Update `src/screens/CorrectScreen.tsx`
  - [x] Replace `useContestState()` with `useContestData()`
  - [x] Keep `useParticipantCount` as-is
  - [x] Keep `useAnswerDistribution` as-is
  - [x] Remove `contestId` extraction from params

- [x] Update `src/screens/EliminatedScreen.tsx`
  - [x] Replace `useContestState()` with `useContestData()`
  - [x] Keep `useParticipantCount` as-is
  - [x] Keep `useAnswerDistribution` as-is
  - [x] Remove `contestId` extraction from params

- [x] Update `src/screens/WinnerScreen.tsx`
  - [x] Replace `useContestState()` with `useContestData()`
  - [x] Keep `useParticipantCount` as-is
  - [x] Remove `contestId` extraction from params

### Phase 4: Update Route References

- [x] Update `src/configs/routes.ts` if route paths changed
- [x] Search codebase for hardcoded route strings and update
- [x] Verify `router.replace()` calls in screens still work with new paths

### Phase 5: Code Quality

- [x] Run TypeScript type checking: `npx tsc --noEmit`
- [x] Run ESLint: `npm run lint` (fails due to existing lint issues)
- [ ] Run Prettier: `npm run format`
- [x] Verify no architectural violations (context in `logic/contexts/`, no DB in UI)

### Phase 6: Testing (Optional)

- [ ] Manual testing
  - [ ] Navigate through all contest screens (Lobby → Game → Submitted → Correct/Eliminated → Winner)
  - [ ] Verify state persists across navigation (no loading flash)
  - [ ] Verify realtime updates work (contest state changes)
  - [ ] Check navigation flows still work correctly
  - [ ] Verify answer submission works
  - [ ] Test elimination logic

- [ ] Verify optimizations
  - [ ] Check Supabase dashboard - confirm subscription count is stable during navigation
  - [ ] Verify no subscription teardown/setup on screen transitions
  - [ ] Confirm all screens show consistent data

---

## Expected Impact

### Before (Current)

- Each screen calls `useContestState()` independently
- Navigation causes subscription teardown → setup cycle
- Brief re-initialization on each screen transition
- Each screen extracts `contestId` from params

### After

- ✅ Single `useContestState` instance shared via Context
- ✅ Subscriptions stay alive across screen navigation
- ✅ Instant screen transitions (data already loaded)
- ✅ Single source of truth - impossible for screens to have stale data
- ✅ Cleaner screens - just consume `useContestData()`
- ✅ Reduced connection churn on Supabase

**Note:** This doesn't reduce per-user subscription count (still 4 per user). It reduces subscription setup/teardown cycles during the game flow.

---

## File Structure After Implementation

```
app/
  _layout.tsx              # Root layout (auth, theme)
  index.tsx                # Entry/splash
  contests/index.tsx       # Contest list (outside provider)
  (contest)/               # Route group for contest flow
    _layout.tsx            # ContestStateProvider wrapper
    lobby/index.tsx
    game/[contestId].tsx   # Renamed from contest/[contestId]
    submitted/index.tsx
    correct/index.tsx
    eliminated/index.tsx
    winner/index.tsx

src/logic/
  contexts/
    index.ts
    ContestStateContext.tsx
  hooks/
    useContestState.ts     # Unchanged - provider uses this internally
    useParticipantCount.ts # Unchanged - screens use directly
    useAnswerDistribution.ts # Unchanged - screens use directly
```

---

## Architecture Notes

### Why Route Groups?

Expo Router route groups `(folder)` provide:
- Shared layout without affecting URL (routes stay as `/lobby`, `/submitted`, etc.)
- Clean provider scoping - provider mounts when entering contest flow, unmounts when leaving
- No conditional logic needed in root layout

### What We're NOT Doing (Intentionally)

- **Not sharing `useParticipantCount`** - It's a polling hook with configurable interval. Screens can decide their own poll frequency.
- **Not sharing `useAnswerDistribution`** - Only 3 screens need it, and they fetch at different times. Adding caching logic adds complexity without clear benefit.
- **Not centralizing navigation logic** - Each screen managing its own `playerState` → route logic is explicit and easy to reason about.

### Context vs. State Library

We chose React Context over Zustand/Jotai because:
- Single piece of state (contest data) - Context handles this fine
- No complex selectors needed
- Stays within React idioms
- No additional dependency

---

## Database Schema Reference

### contests table

- `id` (uuid), `name` (text), `current_round` (int), `start_time` (timestamptz), `price` (numeric), `created_at` (timestamp), `state` (enum)
- Main changing fields: `current_round`, `state`
- Subscription: Single row filtered by `id=eq.{contestId}`

### questions table

- `id` (uuid), `contest_id` (uuid), `round` (int), `question` (text), `options` (jsonb), `correct_option` (array of answer_option enum)
- `correct_option` starts NULL, updates when admin reveals answer
- Subscription: All questions filtered by `contest_id=eq.{contestId}`, event: `*` (wildcard needed for updates)

### participants table

- `id` (uuid), `contest_id` (uuid), `user_id` (uuid), `elimination_round` (int nullable), `created_at` (timestamptz)
- `elimination_round` NULL = active, non-NULL = eliminated
- Each user subscribes to their own participant record only

### answers table

- `id` (uuid), `participant_id` (uuid), `round` (int), `answer` (enum), `timestamp` (timestamp), `contest_id` (uuid), `question_id` (uuid)
- Each user subscribes to their own answers only

