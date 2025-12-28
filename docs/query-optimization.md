# Query & Subscription Optimization Checklist

## Context

Optimizing data fetching and realtime subscriptions for SBHQ mobile app to support 20-1000 concurrent users per contest.

## Root Problem

- ❌ Multiple screens independently call `useContestState`, creating duplicate subscriptions
- ❌ Each screen has separate state instance - when realtime updates fire, only one instance updates
- ❌ Other screens don't re-render because they have stale state
- ❌ Original bug: AnswerDistributionChart doesn't appear when contest state changes

## Solution Overview

Create `ContestStateProvider` context to share single subscription and state across all screens.

---

## Implementation Checklist

### Phase 1: Create Context Provider

- [ ] Create `src/logic/contexts/` folder
- [ ] Create `src/logic/contexts/ContestStateContext.tsx`
  - [ ] Accept `contestId` and `userId` as props
  - [ ] Manage single `useContestState` instance
  - [ ] Manage single `useParticipantCount` instance
  - [ ] Manage `useAnswerDistribution` with caching by round
  - [ ] Watch for `correct_option` updates on current round → refetch distribution
  - [ ] Export `ContestStateProvider` component
  - [ ] Export `useContestData()` hook
  - [ ] Add proper TypeScript types

### Phase 2: Integrate Provider

- [ ] Update `app/_layout.tsx`
  - [ ] Import `ContestStateProvider` and `useAuth`
  - [ ] Extract `contestId` from route segments/searchParams using `useSegments()` and `useLocalSearchParams()`
  - [ ] Get `userId` from `useAuth().derivedUser?.id`
  - [ ] Conditionally wrap `Slot` with provider when in contest flow
  - [ ] Pass `contestId` and `userId` as props to provider

### Phase 3: Update Screens to Use Context

- [ ] Update `src/screens/LobbyScreen.tsx`
  - [ ] Replace `useContestState()` with `useContestData()`
  - [ ] Replace `useParticipantCount()` with `participantCount` from context
  - [ ] Remove `contestId` and `userId` params (get from context)

- [ ] Update `src/screens/GameScreen.tsx`
  - [ ] Replace `useContestState()` with `useContestData()`
  - [ ] Replace `useParticipantCount()` with `participantCount` from context
  - [ ] Remove `contestId` and `userId` params (get from context)

- [ ] Update `src/screens/SubmittedScreen.tsx`
  - [ ] Replace `useContestState()` with `useContestData()`
  - [ ] Replace `useParticipantCount()` with `participantCount` from context
  - [ ] Replace `useAnswerDistribution()` with `getDistributionForRound()` from context
  - [ ] Remove `contestId` and `userId` params (get from context)
  - [ ] Remove debug console.logs

- [ ] Update `src/screens/CorrectScreen.tsx`
  - [ ] Replace `useContestState()` with `useContestData()`
  - [ ] Replace `useParticipantCount()` with `participantCount` from context
  - [ ] Replace `useAnswerDistribution()` with `getDistributionForRound()` from context
  - [ ] Remove `contestId` and `userId` params (get from context)

- [ ] Update `src/screens/EliminatedScreen.tsx`
  - [ ] Replace `useContestState()` with `useContestData()`
  - [ ] Replace `useParticipantCount()` with `participantCount` from context
  - [ ] Replace `useAnswerDistribution()` with `getDistributionForRound()` from context
  - [ ] Remove `contestId` and `userId` params (get from context)

- [ ] Update `src/screens/WinnerScreen.tsx`
  - [ ] Replace `useContestState()` with `useContestData()`
  - [ ] Replace `useParticipantCount()` with `participantCount` from context
  - [ ] Remove `contestId` and `userId` params (get from context)

### Phase 4: Clean Up Debug Logs

- [ ] Remove console.logs from `src/logic/hooks/useContestState.ts`
  - [ ] Line 43: "Current contest state in hook"
  - [ ] Line 131-132: "Contest state changed to" and "Calling setContest with"
  - [ ] Line 217: "Hook returning contest state"

- [ ] Remove console.logs from `src/logic/hooks/useAnswerDistribution.ts`
  - [ ] Line 27: "Starting fetch - round"
  - [ ] Line 39: "Success - got X items"
  - [ ] Line 42: "Error"

- [ ] Remove console.logs from `src/screens/SubmittedScreen.tsx`
  - [ ] Line 32-36: "Render - contest"
  - [ ] Line 45: "roundToFetch"
  - [ ] Line 50-55: "State update" useEffect

### Phase 5: Testing

- [ ] Manual testing
  - [ ] Navigate through all contest screens (Lobby → Game → Submitted → Correct/Eliminated → Winner)
  - [ ] Verify chart appears when contest state changes to ROUND_CLOSED
  - [ ] Verify participant count updates when players are eliminated
  - [ ] Verify answer distribution appears with correct data
  - [ ] Check navigation flows still work correctly
  - [ ] Verify answer submission works
  - [ ] Test elimination logic

- [ ] Verify optimizations
  - [ ] Check Supabase dashboard - confirm only 1 subscription per user (not 4+)
  - [ ] Verify no duplicate subscriptions to same contest
  - [ ] Monitor for subscription cleanup on navigation
  - [ ] Confirm all screens show consistent data

### Phase 6: Code Quality

- [ ] Run TypeScript type checking: `npm run tsc`
- [ ] Run ESLint: `npm run lint` (or `npm run lint:fix` for auto-fixes)
- [ ] Run Prettier: `npm run format`
- [ ] Verify no architectural violations
- [ ] Review changes match established patterns

---

## Expected Impact

### Before Optimization (100 users)

- 400 total subscriptions (4 per user: contest, participant, questions, answers)
- 200 duplicate subscriptions (contest + questions shared across users)
- Screens don't re-render on state changes ❌
- Chart doesn't appear ❌
- Stale participant counts ❌

### After Optimization (100 users)

- 400 total subscriptions (still 4 per user through provider)
- 200 duplicate subscriptions (contest + questions still shared)
- ✅ All screens re-render correctly
- ✅ Chart appears when round closes
- ✅ Single source of truth for all contest data
- ✅ Easier to maintain and debug

**Note:** Subscription duplication at server level (100 users = 100 identical contest subscriptions) is a known limitation. For scale beyond 500+ users, consider server-side optimizations (broadcast channels, connection pooling).

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

---

## Architecture Notes

### Folder Organization

- ✅ Contexts go in `src/logic/contexts/` (new folder)
- ✅ Hooks stay in `src/logic/hooks/`
- ✅ Screens stay thin - just consume context
- ✅ All Supabase usage stays in `src/db/`

### Context Update Flow

1. Database change (e.g., contest state: ROUND_IN_PROGRESS → ROUND_CLOSED)
2. Supabase realtime broadcasts UPDATE event
3. **Single** `ContestStateProvider` receives event (only one subscription)
4. Provider calls `setContest` internally
5. Context value updates
6. React detects context change
7. **All** screens using `useContestData()` automatically re-render
8. Chart appears, counts update, etc.

### Design Decisions

- **Participant count:** Keep current polling approach (only changes when questions get answers assigned)
- **Answer distribution:** Fetch once when round closes, refetch when `correct_option` updates
- **Questions subscription:** Keep wildcard `event: '*'` (needed for `correct_option` updates)
- **ContestRegistration:** No changes needed (single user queries, not N+1)
- **Provider placement:** `app/_layout.tsx` with props (not internal param extraction)
