# Realtime Optimization Plan

## Summary

### What We're Accomplishing
Reduce Supabase Realtime connections from **4 per user to 1 per user** (75% reduction), enabling 500+ concurrent users on Pro plan instead of 125.

### Why
- **Current:** 4 postgres_changes subscriptions per user (contests, questions, participants, answers)
- **Problem:** 125 users = 500 connections (Pro plan limit)
- **Secondary issue:** Race conditions when checking elimination status after round closes

### How
1. **Database:** Add `processing_status` enum to `questions` table to signal when elimination trigger completes
2. **Database:** Add broadcast triggers for `contests` and `questions` tables
3. **Client:** Replace 4 postgres_changes subscriptions with 1 broadcast channel
4. **Client:** Query participant on-demand when `processing_status = 'COMPLETE'`

### Result
- 1 broadcast channel per user (receives contest + question updates)
- Query participant status only when results are ready (no race condition)
- Navigation: existing `derivePlayerState` already checks `participant.elimination_round`

---

## Current Architecture

### Relevant Tables

```
questions:
  - id: text (PK)
  - contest_id: text (FK → contests)
  - round: integer
  - question: text
  - options: jsonb
  - correct_option: answer_option[] | null  ← Set by GM when round closes

participants:
  - id: text (PK)
  - contest_id: text (FK → contests)
  - user_id: uuid (FK → users)
  - elimination_round: integer | null  ← Set by trigger when eliminated
```

### Current Subscriptions (useContestState.ts lines 131-172)

```typescript
// 4 postgres_changes subscriptions:
1. subscribeToContest(contestId, ...)           // src/db/contests.ts
2. subscribeToParticipant(participantId, ...)   // src/db/participants.ts
3. subscribeToAnswersForParticipant(...)        // src/db/answers.ts
4. subscribeToQuestions(contestId, ...)         // src/db/questions.ts
```

### Existing Navigation Flow

```
derivePlayerState() → returns PlayerState → ContestRouter navigates:
  - ELIMINATED → /eliminated
  - CORRECT_WAITING_NEXT → /correct
  - WINNER → /winner
  - etc.
```

`derivePlayerState` already checks `participant.elimination_round !== null` for elimination.

---

## Implementation Todos

### Phase 1: Database Migration

**File:** `supabase/migrations/YYYYMMDDHHMMSS_realtime_optimization.sql`

- [x] Create processing_status enum:
  ```sql
  CREATE TYPE processing_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETE');
  ```

- [x] Add column to questions table:
  ```sql
  ALTER TABLE questions
  ADD COLUMN processing_status processing_status DEFAULT 'PENDING';
  ```

- [x] Update `eliminate_incorrect_players()` trigger:
  ```sql
  CREATE OR REPLACE FUNCTION eliminate_incorrect_players()
  RETURNS trigger AS $$
  DECLARE
    project_url text;
    service_role_key text;
    notification_response jsonb;
  BEGIN
    IF NEW.correct_option IS NULL OR array_length(NEW.correct_option, 1) IS NULL THEN
      RETURN NEW;
    END IF;

    -- Signal processing started
    NEW.processing_status := 'PROCESSING';

    -- Existing elimination logic (unchanged)
    UPDATE participants
    SET elimination_round = NEW.round
    WHERE
      participants.elimination_round IS NULL
      AND participants.contest_id = NEW.contest_id
      AND (
        participants.id IN (
          SELECT answers.participant_id
          FROM answers
          WHERE answers.question_id = NEW.id
            AND NOT (answers.answer = ANY(NEW.correct_option))
        )
        OR NOT EXISTS (
          SELECT 1
          FROM answers
          WHERE answers.participant_id = participants.id
            AND answers.question_id = NEW.id
        )
      );

    -- Signal processing complete
    NEW.processing_status := 'COMPLETE';

    -- Existing notification logic (unchanged)
    SELECT current_setting('app.settings.project_url', true) INTO project_url;
    SELECT current_setting('app.settings.service_role_key', true) INTO service_role_key;

    IF project_url IS NOT NULL AND service_role_key IS NOT NULL THEN
      SELECT net.http_post(
        url := project_url || '/functions/v1/send-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object(
          'contestId', NEW.contest_id,
          'type', 'RESULT_POSTED',
          'round', NEW.round
        )
      ) INTO notification_response;
    END IF;

    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  ```

- [ ] Test trigger locally

---

### Phase 2: Broadcast Triggers

- [x] Create broadcast function for contests:
  ```sql
  CREATE OR REPLACE FUNCTION broadcast_contest_changes()
  RETURNS trigger AS $$
  BEGIN
    PERFORM realtime.send(
      to_jsonb(NEW),
      'UPDATE',
      'contest:' || NEW.id,
      true  -- private
    );
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER contests_broadcast_trigger
    AFTER UPDATE ON contests
    FOR EACH ROW
    EXECUTE FUNCTION broadcast_contest_changes();
  ```

- [x] Create broadcast function for questions:
  ```sql
  CREATE OR REPLACE FUNCTION broadcast_question_changes()
  RETURNS trigger AS $$
  BEGIN
    PERFORM realtime.send(
      to_jsonb(NEW),
      TG_OP,
      'contest:' || NEW.contest_id,
      true  -- private
    );
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TRIGGER questions_broadcast_trigger
    AFTER INSERT OR UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION broadcast_question_changes();
  ```

- [ ] Test broadcasts are received by clients

---

### Phase 3: Update TypeScript Types

**File:** `src/db/types.ts`

- [x] Regenerate types with `supabase gen types typescript`

---

### Phase 4: Client Infrastructure

**File:** `src/db/realtime.ts`

- [x] Add broadcast subscription helper:
  ```typescript
  export const subscribeToBroadcast = <T>(
    channel: string,
    events: { event: string; callback: (data: T) => void }[],
  ): (() => void) => {
    const realtimeChannel = SUPABASE_CLIENT.channel(channel, {
      config: { private: true },
    });

    events.forEach(({ event, callback }) => {
      realtimeChannel.on('broadcast', { event }, (message) => {
        callback(message.payload as T);
      });
    });

    void realtimeChannel.subscribe();

    return () => {
      void SUPABASE_CLIENT.removeChannel(realtimeChannel);
    };
  };
  ```

---

### Phase 5: Update useContestState Hook

**File:** `src/logic/hooks/useContestState.ts`

- [x] Replace lines 131-172 (subscription setup) with single broadcast channel:
  ```typescript
  useEffect(() => {
    if (!contestId || !hasInitializedRef.current) return undefined;

    const unsub = subscribeToBroadcast<ContestRow | QuestionRow>(
      `contest:${contestId}`,
      [
        {
          event: 'UPDATE',
          callback: (data) => {
            if ('state' in data) {
              setContest(data as ContestRow);
            }
            if ('question' in data) {
              const q = data as QuestionRow;
              setQuestion((prev) =>
                q.round >= (prev?.round ?? 0) ? q : prev
              );
            }
          },
        },
        {
          event: 'INSERT',
          callback: (data) => {
            if ('question' in data) {
              const q = data as QuestionRow;
              const currentRound = contestRoundRef.current || questionRoundRef.current;
              if (q.round <= currentRound) {
                setQuestion((prev) =>
                  q.round >= (prev?.round ?? 0) ? q : prev
                );
              }
            }
          },
        },
      ],
    );

    return unsub;
  }, [contestId]);
  ```

- [x] Remove `subscribeToContest` call (line 136-139)
- [x] Remove `subscribeToParticipant` call (lines 141-145)
- [x] Remove `subscribeToAnswersForParticipant` call (lines 147-155)
- [x] Remove `subscribeToQuestions` call (lines 158-167)

---

### Phase 6: Add Results-Ready Handler

**File:** `src/logic/hooks/useContestState.ts`

- [x] Add effect to refresh participant when processing completes:
  ```typescript
  useEffect(() => {
    if (question?.processing_status === 'COMPLETE' && contestId && userId) {
      refreshParticipant();
    }
  }, [question?.processing_status, contestId, userId]);

  const refreshParticipant = async () => {
    if (!contestId || !userId) return;

    const result = await getParticipantForUser(contestId, userId);
    if (result.ok && result.value) {
      setParticipant(result.value);
    }
  };
  ```

**Note:** We use `getParticipantForUser(contestId, userId)` since `getParticipantById` doesn't exist.

---

### Phase 7: Remove Old Subscription Functions

- [x] Delete `subscribeToContest` from `src/db/contests.ts`
- [x] Delete `subscribeToParticipant` from `src/db/participants.ts`
- [x] Delete `subscribeToQuestions` from `src/db/questions.ts`
- [x] Delete `subscribeToAnswersForParticipant` from `src/db/answers.ts`
- [x] Remove imports from `useContestState.ts`

---

### Phase 8: Testing

- [x] Automated tests: `npm test` (passes; existing Animated act warnings remain)
- [ ] Test: Submit answer → Wait → GM sets correct_option → Navigate to /correct or /eliminated
- [ ] Test: Wrong answer → `elimination_round` set → Navigate to /eliminated
- [ ] Test: Right answer → `elimination_round` null → Navigate to /correct
- [ ] Test: Demo mode still works (uses separate `useDemoContestState` hook)
- [ ] Verify connection count in Supabase dashboard (should drop ~75%)

---

### Phase 9: Deploy

- [x] Apply migration to production
- [ ] Verify triggers active
- [ ] Deploy client update
- [ ] Monitor realtime connections and errors

---

## Key Implementation Details

### Processing Status Enum
```
PENDING → PROCESSING → COMPLETE
   ↑          ↑           ↑
 default   trigger     trigger
           starts       ends
```

Client only acts when `processing_status === 'COMPLETE'`.

### Channel Naming
- Channel: `contest:{contestId}` (colon separator)
- Both contests and questions broadcast to same channel
- Distinguish by checking for `state` (contest) vs `question` (question) field

### Navigation Flow (Unchanged)
```
1. Question broadcast arrives with processing_status = 'COMPLETE'
2. useContestState calls getParticipantForUser()
3. setParticipant(freshData) triggers re-render
4. derivePlayerState() re-runs with fresh participant.elimination_round
5. ContestRouter navigates based on playerState:
   - ELIMINATED → /eliminated
   - CORRECT_WAITING_NEXT → /correct
   - WINNER → /winner
```

### Demo Mode (Unaffected)
- Demo uses `useDemoContestState` hook with simulated data
- Check: `contestId === DEMO_CONTEST_ID`
- No realtime subscriptions in demo mode

---

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Connections per user | 4 | 1 |
| Max users (Pro plan) | 125 | 500 |
| Race conditions | Yes | No |
| DB load (WAL reading) | High | Minimal |

---

## Verified Facts

| Item | Status | Source |
|------|--------|--------|
| Eliminated route | `/eliminated` | `src/configs/routes.ts` |
| Correct route | `/correct` | `src/configs/routes.ts` |
| Participant query | `getParticipantForUser(contestId, userId)` | `src/db/participants.ts` |
| Subscription usage | Only in `useContestState.ts` | Grep search |
| Navigation handler | `ContestRouter` + `derivePlayerState` | `src/logic/routing/ContestRouter.tsx` |
| Demo mode | Separate hook, unaffected | `src/logic/hooks/useDemoContestState.ts` |



  - [x] Register from app: tap Register → button changes to “Pending approval” and stays on list.
  - [x] Approve from web: refresh list → button changes to “Join Contest.”
  - [x] Join contest: tap “Join Contest” → navigates to lobby/game based on contest state.
  - [ ] Round open: question appears, can select option, Submit enabled.
  - [ ] Submit: tap Submit → navigates to Submitted screen, button disabled, answer locked.
  - [ ] Results posted: after GM sets correct option, app moves to Correct or Eliminated without manual refresh.
  - [ ] Next round: from Correct, contest moves to ROUND_IN_PROGRESS → app routes to Game.
  - [ ] Winner: once contest finishes and user remains, app routes to Winner.
  - [ ] Demo mode: demo flow still cycles through lobby → game → submitted → correct/eliminated → finish.
  - [ ] Realtime connections: verify 1 connection per user in Supabase dashboard during live contest.
