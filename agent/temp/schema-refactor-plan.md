# Database Schema Refactor: State Machine Architecture

## Goal
Simplify contest state management by replacing 3 boolean flags with a single atomic `state` enum column, eliminating race conditions and reducing query complexity.

## Problem Summary
- **Current**: Contest state derived from 3 booleans (`lobby_open`, `submission_open`, `finished`)
- **Issues**: Race conditions, 4-query waterfall on load, "in-between states", complex 58-line derivation logic
- **Solution**: Single `contest.state` enum as source of truth, simplify to ~20 lines of logic

---

## Phase 1: Database Migration (Clean Slate - MVP)

**Context**: We're in MVP, can clear data and restart fresh. No backwards compatibility needed.

### Single Migration: Clean Schema Update
```sql
-- Create enum type
CREATE TYPE contest_state AS ENUM (
  'UPCOMING',           -- Contest scheduled, not open yet
  'LOBBY_OPEN',         -- Accepting participants, not started
  'ROUND_IN_PROGRESS',  -- Question active, submissions open
  'ROUND_CLOSED',       -- Reviewing answers, showing results
  'FINISHED'            -- Contest completed
);

-- Drop old columns, add new state column
ALTER TABLE contests
  DROP COLUMN lobby_open,
  DROP COLUMN submission_open,
  DROP COLUMN finished,
  ADD COLUMN state contest_state NOT NULL DEFAULT 'UPCOMING';

-- Remove redundant participant field
ALTER TABLE participants
  DROP COLUMN active;
```

**That's it!** No backfill, no backwards compatibility, just the clean new schema.

---

## Phase 2: TypeScript Types Update

### File: `src/db/types.ts`

1. **Add ContestState enum** (line ~216 in Enums section):
```typescript
Enums: {
  contest_state: 'UPCOMING' | 'LOBBY_OPEN' | 'ROUND_IN_PROGRESS' | 'ROUND_CLOSED' | 'FINISHED'
}
```

2. **Update ContestRow interface** (lines 69-80):
```typescript
contests: {
  Row: {
    created_at: string | null
    current_round: number | null
    id: string
    name: string
    price: number | null
    start_time: string
    state: Database['public']['Enums']['contest_state']  // NEW - replaces 3 booleans
  }
  // ... Insert/Update types (also remove finished, lobby_open, submission_open)
}
```

3. **Update ParticipantRow interface** (lines 105-129):
```typescript
participants: {
  Row: {
    contest_id: string | null
    created_at: string
    elimination_round: number | null  // null = active, number = eliminated in that round
    id: string
    user_id: string | null
    // REMOVED: active: boolean | null
  }
  // ... Insert/Update types (also remove active)
}
```

4. **Add type alias** (after line 353):
```typescript
export type ContestState = Database['public']['Enums']['contest_state']
```

---

## Phase 3: Simplified State Derivation Logic

### File: `src/logic/contest/derivePlayerState.ts`

**Replace entire function** (lines 4-58) with simplified version:

```typescript
export const derivePlayerState = (
  contest: ContestRow | null,
  participant: ParticipantRow | null,
  question: QuestionRow | null,
  answer: AnswerRow | null,
): PlayerState => {
  if (!contest || !participant) {
    return PLAYER_STATE.UNKNOWN;
  }

  // Terminal state: Eliminated
  if (participant.elimination_round !== null) {
    return PLAYER_STATE.ELIMINATED;
  }

  // Map contest state to player state
  switch (contest.state) {
    case 'LOBBY_OPEN':
      return PLAYER_STATE.LOBBY;

    case 'ROUND_IN_PROGRESS':
      return answer ? PLAYER_STATE.SUBMITTED_WAITING : PLAYER_STATE.ANSWERING;

    case 'ROUND_CLOSED':
      // Check if answer is correct (for display purposes)
      if (!answer) {
        return PLAYER_STATE.ELIMINATED; // Missed deadline
      }
      if (question?.correct_option === null) {
        return PLAYER_STATE.SUBMITTED_WAITING; // Waiting for admin to set answer
      }
      return answer.answer === question?.correct_option
        ? PLAYER_STATE.CORRECT_WAITING_NEXT
        : PLAYER_STATE.ELIMINATED;

    case 'FINISHED':
      return PLAYER_STATE.WINNER; // Still active = winner

    case 'UPCOMING':
    default:
      return PLAYER_STATE.UNKNOWN;
  }
};
```

**Key changes:**
- Removed redundant `active` check (line 15)
- Removed `contest.finished` check (line 20)
- Removed `contest.lobby_open` check (line 25)
- Removed `contest.submission_open` check (line 30)
- Single `switch` statement on `contest.state`
- Reduced from 58 lines to ~35 lines

---

## Phase 4: Query Optimization

### File: `src/logic/hooks/useContestState.ts`

#### A. Optimize Initial Load (lines 54-79)

**Current** (4 sequential queries):
```typescript
// 1. Contest
const contestResult = await getContestById(contestId);
// 2. Participant
const participantResult = await getParticipantForUser(contestId, userId);
// 3. Question (waits for contest.current_round)
const roundQuestion = await getQuestionForRound(contestResult.id, contestResult.current_round);
// 4. Answer (waits for participant + question)
const existingAnswer = await getAnswerForQuestion(ensuredParticipant.id, roundQuestion.id);
```

**Optimized** (2 parallel queries):
```typescript
// Query 1: Contest + Question (joined)
const contestWithQuestion = await SUPABASE_CLIENT
  .from('contests')
  .select(`
    *,
    questions!inner(*)
  `)
  .eq('id', contestId)
  .eq('questions.round', contestResult.current_round) // Filter to current round only
  .maybeSingle();

// Query 2: Participant + Answer (parallel)
const participantWithAnswer = userId ? await SUPABASE_CLIENT
  .from('participants')
  .select(`
    *,
    answers(*)
  `)
  .eq('contest_id', contestId)
  .eq('user_id', userId)
  .eq('answers.round', contestResult.current_round) // Filter to current round
  .maybeSingle() : null;
```

**Implementation strategy:**
1. Create helper function `getContestStateData(contestId, userId)` in `src/db/contests.ts`
2. Use Supabase joins to fetch related data in 1-2 queries
3. Update `fetchContestState` to use new helper

#### B. Simplify Subscriptions (lines 92-132)

**Current**: 4 separate subscriptions
- `subscribeToContest` - watches 3 booleans
- `subscribeToParticipant` - watches active + elimination_round
- `subscribeToQuestions` - watches all questions
- `subscribeToAnswersForParticipant` - watches answers

**Optimized**: Focus on `contest.state` changes

```typescript
// Primary: Contest state (drives most UI)
const contestUnsub = subscribeToContest(contestId, (updatedContest: ContestRow) => {
  setContest(updatedContest);

  // Refetch question when round changes
  if (updatedContest.current_round !== contest?.current_round) {
    void loadCurrentQuestion(updatedContest.current_round);
  }
});

// Secondary: Participant elimination
const participantUnsub = subscribeToParticipant(participant.id, setParticipant);

// Tertiary: Answers (can poll instead if needed)
const answersUnsub = subscribeToAnswersForParticipant(participant.id, handleAnswerUpdate);
```

#### C. Remove Redundant Question Refetch (lines 134-160)

**Problem**: `useEffect` refetches question on every `contest.current_round` change, even though subscription already handles it.

**Solution**: Only load question in subscription callback, not in separate effect.

---

## Phase 5: Database Query Functions

### File: `src/db/contests.ts`

Add optimized query function:

```typescript
export const getContestStateData = async (
  contestId: string,
  userId?: string,
): AsyncResult<{
  contest: ContestRow | null;
  question: QuestionRow | null;
  participant: ParticipantRow | null;
  answer: AnswerRow | null;
}, DbError> => {
  try {
    // Fetch contest with current question
    const { data: contestData, error: contestError } = await SUPABASE_CLIENT
      .from(DB_TABLES.CONTESTS)
      .select(`
        *,
        questions!inner(*)
      `)
      .eq('id', contestId)
      .maybeSingle();

    if (contestError) {
      return Err(networkError(`Failed to fetch contest state: ${contestError.message}`));
    }

    let participant: ParticipantRow | null = null;
    let answer: AnswerRow | null = null;

    if (userId) {
      const { data: participantData, error: participantError } = await SUPABASE_CLIENT
        .from(DB_TABLES.PARTICIPANTS)
        .select(`
          *,
          answers(*)
        `)
        .eq('contest_id', contestId)
        .eq('user_id', userId)
        .maybeSingle();

      if (participantError) {
        return Err(networkError(`Failed to fetch participant: ${participantError.message}`));
      }

      participant = participantData as ParticipantRow | null;
      answer = (participantData?.answers?.[0] as AnswerRow) ?? null;
    }

    const contest = contestData as ContestRow | null;
    const question = (contestData?.questions?.[0] as QuestionRow) ?? null;

    return Ok({ contest, question, participant, answer });
  } catch (err) {
    return Err(networkError(`Unexpected error: ${(err as Error).message}`));
  }
};
```

---

## Phase 6: Admin Helper Functions (Optional)

### File: `src/db/contests.ts` (add at end)

```typescript
// Admin state transition helpers
export const openLobby = async (contestId: string): AsyncResult<void, DbError> => {
  const { error } = await SUPABASE_CLIENT
    .from(DB_TABLES.CONTESTS)
    .update({ state: 'LOBBY_OPEN' })
    .eq('id', contestId);

  return error ? Err(networkError(error.message)) : Ok(undefined);
};

export const startRound = async (
  contestId: string,
  roundNumber: number,
): AsyncResult<void, DbError> => {
  const { error } = await SUPABASE_CLIENT
    .from(DB_TABLES.CONTESTS)
    .update({
      state: 'ROUND_IN_PROGRESS',
      current_round: roundNumber,
    })
    .eq('id', contestId);

  return error ? Err(networkError(error.message)) : Ok(undefined);
};

export const closeRound = async (contestId: string): AsyncResult<void, DbError> => {
  const { error } = await SUPABASE_CLIENT
    .from(DB_TABLES.CONTESTS)
    .update({ state: 'ROUND_CLOSED' })
    .eq('id', contestId);

  return error ? Err(networkError(error.message)) : Ok(undefined);
};

export const finishContest = async (contestId: string): AsyncResult<void, DbError> => {
  const { error } = await SUPABASE_CLIENT
    .from(DB_TABLES.CONTESTS)
    .update({ state: 'FINISHED' })
    .eq('id', contestId);

  return error ? Err(networkError(error.message)) : Ok(undefined);
};
```

---

## Phase 7: Update Constants

### File: `src/logic/constants.ts`

Add contest state constants:

```typescript
export const CONTEST_STATE = {
  UPCOMING: 'UPCOMING',
  LOBBY_OPEN: 'LOBBY_OPEN',
  ROUND_IN_PROGRESS: 'ROUND_IN_PROGRESS',
  ROUND_CLOSED: 'ROUND_CLOSED',
  FINISHED: 'FINISHED',
} as const;

export type ContestStateValue = (typeof CONTEST_STATE)[keyof typeof CONTEST_STATE];
```

---

## Testing Strategy

1. **Database**: Verify enum type created and columns updated correctly
2. **Type Safety**: Run `npx tsc --noEmit` to catch type errors
3. **ESLint**: Run `npx eslint src --ext .ts,.tsx` to ensure code quality
4. **Manual Testing**:
   - Load contest and verify 2 queries instead of 4 (check DevTools Network tab)
   - Test real-time state updates trigger correctly
   - Test each state transition: UPCOMING → LOBBY_OPEN → ROUND_IN_PROGRESS → ROUND_CLOSED → FINISHED
   - Verify player state derives correctly at each stage

---

## Rollback Plan

**Since we're in MVP**: Just revert the SQL migration and code changes. No data to worry about.

---

## Expected Improvements

- **Load Time**: 40-60% faster (2 queries vs 4 sequential)
- **State Consistency**: 100% (atomic state column)
- **Code Complexity**: 60% less state derivation code
- **Race Conditions**: Eliminated (single field update)

---

## Critical Files

- [ ] `src/db/types.ts` - Add `contest_state` enum, update ContestRow/ParticipantRow
- [ ] `src/logic/contest/derivePlayerState.ts` - Simplify to switch statement
- [ ] `src/logic/hooks/useContestState.ts` - Optimize queries, simplify subscriptions
- [ ] `src/db/contests.ts` - Add `getContestStateData()` helper, optional admin functions
- [ ] `src/logic/constants.ts` - Add CONTEST_STATE constants

---

## Implementation Order

1. Run database migration (single clean update)
2. Regenerate TypeScript types from Supabase schema
3. Update constants (add CONTEST_STATE)
4. Simplify derivePlayerState logic (switch statement)
5. Add getContestStateData helper function
6. Update useContestState hook (optimized queries)
7. Test: TypeScript, ESLint, manual flow
8. Verify query count reduced (Network tab)
