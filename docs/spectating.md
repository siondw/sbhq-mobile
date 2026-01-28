# Spectator Mode Implementation Plan

## Overview

Add spectator mode allowing users to watch contests live without participating or after being eliminated. Spectators see the same screens as active players (questions, waiting screens) but cannot submit answers and display a clear "Spectating" banner.

**Scope:**
- Eliminated users can continue watching after being knocked out
- Non-registered users can watch in-progress contests from contest list
- Spectating is session-based (route parameter), no persistence

## Architecture Approach

**Route-Based Spectating (No Storage Required)**

1. Pass `spectating: 'true'` as route parameter when navigating to game screens
2. Keep normal player states (ANSWERING, SUBMITTED_WAITING, ELIMINATED, etc.) - derive normally
3. Screens check for `spectating` route param to show banner and disable submissions
4. Add "Spectate" button on contest list for in-progress contests
5. Add "Continue as Spectator" button on EliminatedScreen
6. If user navigates away and returns, they re-select "Spectate" (no persistence)

This is the simplest approach - spectating is just a viewing mode controlled by routing.

## Implementation Steps

### 1. Create Spectator Banner Component

**File: `src/ui/components/SpectatorBanner.tsx` (NEW)**
- Create compact banner similar to DemoBanner
- Props: `onLeave: () => void`
- Content: Eye icon (Ionicons "eye") + "Spectating" text + "Leave" button
- Style: Glassy texture with warning/muted colors, subtle border
- Position: Full width, fixed height ~48px, margin bottom for spacing

### 2. Update Routing to Allow Spectators

**File: `src/logic/routing/ContestRouter.tsx`**
- Import `useLocalSearchParams` from expo-router to access route params
- Get spectating flag: `const { spectating } = useLocalSearchParams<{ spectating?: string }>();`
- Check if spectating: `const isSpectating = spectating === 'true';`
- Modify routing logic (around line 67) to allow spectators through:
  ```typescript
  if (playerState !== validState) {
    // Allow spectators to bypass state-based redirects for game screens
    const isSpectatorViewing =
      isSpectating &&
      (validState === PLAYER_STATE.ANSWERING || validState === PLAYER_STATE.SUBMITTED_WAITING);

    if (!isSpectatorViewing) {
      // Normal routing (existing switch statement)
      switch (playerState) { ... }
    }
  }
  ```
- Update loading check (line 95) similarly:
  ```typescript
  const isSpectatorViewing =
    isSpectating &&
    (validState === PLAYER_STATE.ANSWERING || validState === PLAYER_STATE.SUBMITTED_WAITING);

  if (!loading && contestId && playerState !== validState && playerState !== PLAYER_STATE.UNKNOWN) {
    if (!isSpectatorViewing && !shouldHoldResultRedirect) {
      return <LoadingView />;
    }
  }
  ```

### 3. Add Spectator Button to EliminatedScreen

**File: `src/screens/EliminatedScreen.tsx`**
- Add handler function before return statement:
  ```typescript
  const handleSpectate = () => {
    router.replace({
      pathname: `${ROUTES.GAME}/[contestId]`,
      params: { contestId, spectating: 'true' },
    });
  };
  ```
- Replace single button (line 178) with two-button layout:
  ```typescript
  <Animated.View style={[styles.footer, { opacity: contentAnim }]}>
    <View style={styles.buttonRow}>
      <Button
        label="Continue as Spectator"
        onPress={handleSpectate}
        variant="primary"
      />
      <Button
        label="Back to Contests"
        onPress={() => router.replace(ROUTES.INDEX)}
        variant="secondary"
      />
    </View>
  </Animated.View>
  ```
- Add `buttonRow` style:
  ```typescript
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  ```

### 4. Add Spectator UI to GameScreen

**File: `src/screens/GameScreen.tsx`**
- Import SpectatorBanner component and `useLocalSearchParams`
- Get spectating flag from route params:
  ```typescript
  const { spectating } = useLocalSearchParams<{ spectating?: string }>();
  const isSpectating = spectating === 'true';
  ```
- Add banner above scorebug (line 100):
  ```typescript
  {isSpectating && (
    <SpectatorBanner
      onLeave={() => router.replace(ROUTES.INDEX)}
    />
  )}
  ```
- Modify `isAnswerLocked` (line 83) to include spectator check:
  ```typescript
  const isAnswerLocked =
    playerState !== PLAYER_STATE.ANSWERING ||
    isSpectating ||
    !!answer;
  ```
- Hide submit button when spectating (line 135-141):
  ```typescript
  {!isSpectating && (
    <View style={styles.submitRow}>
      <Button ... />
    </View>
  )}
  ```

### 5. Add Spectator UI to SubmittedScreen

**File: `src/screens/SubmittedScreen.tsx`**
- Import SpectatorBanner and `useLocalSearchParams`
- Get spectating flag from route params (same as GameScreen)
- Show banner at top when spectating
- No submit functionality to disable (screen is already read-only)

### 6. Add Spectate Button to Contest List

**File: `src/screens/ContestListScreen.tsx`**
- Modify renderItem logic (lines 225-292) to handle spectate button
- Check if user can spectate:
  ```typescript
  const canSpectate =
    isInProgress &&
    (!isRegistered || (isRegistered && isEliminated));
  ```
- Update button logic:
  ```typescript
  if (canSpectate) {
    buttonLabel = 'Spectate';
    buttonVariant = 'primary';
    buttonIcon = <Feather name="eye" size={20} color={colors.surface} />;
  } else if (isPendingApproval) {
    // ... existing logic
  }
  ```
- Modify `handleEnterContest` to handle spectating:
  ```typescript
  const handleEnterContest = async (contest: ContestRow, shouldSpectate = false) => {
    if (shouldSpectate) {
      // Navigate with spectating param
      router.push({
        pathname: `${ROUTES.GAME}/[contestId]`,
        params: { contestId: contest.id, spectating: 'true' },
      });
      return;
    }
    // ... rest of existing registration logic
  }
  ```
- Update button onPress:
  ```typescript
  onPress={() => void handleEnterContest(item, canSpectate)}
  ```

## User Flows

### Flow 1: Spectate After Elimination

1. **Elimination → Spectate Choice**
   - User gets eliminated (answers incorrectly or misses deadline)
   - Router directs to EliminatedScreen with skull animation
   - Sees two buttons: "Continue as Spectator" or "Back to Contests"

2. **Enable Spectating**
   - User clicks "Continue as Spectator"
   - Navigates to GameScreen with route param: `{ contestId, spectating: 'true' }`
   - ContestRouter detects `spectating` param, allows through
   - GameScreen checks param, shows spectator banner
   - Sees current question but cannot submit

3. **Round Progression as Spectator**
   - Contest broadcasts state changes via realtime
   - Player state derives normally (ELIMINATED for them, UNKNOWN for non-participants)
   - Route param `spectating='true'` persists through navigation within contest
   - Spectator banner shows on all game screens

4. **Leave Spectating**
   - Click "Leave" on spectator banner
   - Navigates to contests list (no spectating param)
   - To spectate again, must click "Spectate" button again

5. **Contest Ends**
   - Contest state becomes `FINISHED`
   - Normal routing takes over (ContestRouter redirects eliminated users to EliminatedScreen)

6. **Reinstatement (Admin Action)**
   - Admin sets `elimination_round` back to null
   - Player state automatically becomes ANSWERING/SUBMITTED_WAITING
   - If still have spectating param, banner shows but they can now submit
   - Better UX: they should leave spectating and re-enter normally (or param can be dropped)

### Flow 2: Spectate from Contest List

1. **Browse Contests**
   - User views contest list
   - Sees in-progress contest they haven't joined OR was eliminated from
   - Button shows "Spectate" with eye icon

2. **Enter as Spectator**
   - User clicks "Spectate"
   - Navigates to GameScreen with `{ contestId, spectating: 'true' }`
   - ContestRouter allows through (spectating param overrides state checks)
   - Sees current round's question with spectator banner

3. **Watch Live**
   - Same spectating experience as Flow 1
   - Can leave anytime via banner
   - Realtime updates keep them synchronized with active players
   - No persistence - navigating away loses spectating mode

## Edge Cases Handled

- ✓ **Contest ends while spectating** - Normal routing takes over, redirects to EliminatedScreen
- ✓ **Navigate away and return** - No spectating param, user sees normal screens (EliminatedScreen or contest list)
- ✓ **Join spectating mid-round** - Sees current round's question via normal data fetching
- ✓ **Disable spectating mid-game** - Click "Leave" navigates to contests list without param
- ✓ **Round transitions** - Realtime broadcasts + player state derivation works normally, spectating param persists
- ✓ **User reinstated by admin** - Player state changes to active, spectating param may still be present but they can now submit (minor UX issue, acceptable)
- ✓ **Non-participant spectating** - useContestState handles null participant gracefully, shows contest/question data only
- ✓ **Spectating without registration** - No participant created, ContestRouter spectating override allows viewing

## Testing Plan

### Unit Tests
- ContestRouter allows through when `spectating='true'` param is present
- ContestRouter blocks when param is missing (normal routing)
- GameScreen `isAnswerLocked` includes spectating check
- Submit button hidden when `spectating='true'`

### Integration Tests
- Navigate with `spectating='true'` → ContestRouter allows viewing game screens
- Spectator cannot submit answers (button hidden, answers locked)
- Spectator banner "Leave" button navigates to contests without param
- Contest list shows "Spectate" button for in-progress contests (non-registered or eliminated)
- Clicking "Spectate" from contest list navigates with spectating param

### Manual Testing Scenarios

**Scenario 1: Eliminated User Spectates**
1. Join contest, get eliminated
2. EliminatedScreen shows two buttons
3. Click "Continue as Spectator"
4. Verify URL contains `spectating=true` param
5. Verify GameScreen shows with banner and question
6. Verify cannot select/submit answers (buttons disabled/hidden)
7. Wait for round transitions, verify stays on game screens with banner
8. Click "Leave" on banner → exits to contests list
9. Navigate back to contest → sees EliminatedScreen (no spectating param)

**Scenario 2: Spectate from Contest List**
1. Open contest list, find in-progress contest you're not in
2. Verify button says "Spectate" with eye icon
3. Click "Spectate"
4. Verify URL contains `spectating=true` param
5. Verify GameScreen shows with banner
6. Watch live round transitions
7. Leave via banner → back to contests

**Scenario 3: Reinstatement**
1. Get eliminated, enable spectating (with param)
2. Have admin clear your `elimination_round` (set to null)
3. Player state changes to active (ANSWERING/etc.)
4. Spectating param may persist, but user can now submit
5. Optional: user leaves and re-enters normally

## Files to Modify

### New Files (1 file)
- `src/ui/components/SpectatorBanner.tsx` - Banner component for spectating mode

### Modified Files (5 files total)

1. **`src/logic/routing/ContestRouter.tsx`**
   - Import `useLocalSearchParams` to access route params
   - Check for `spectating='true'` param
   - Add spectator override logic to bypass state-based redirects for game screens

2. **`src/screens/EliminatedScreen.tsx`**
   - Add "Continue as Spectator" button alongside "Back to Contests"
   - Add handler to navigate with `spectating='true'` param

3. **`src/screens/GameScreen.tsx`**
   - Import SpectatorBanner and `useLocalSearchParams`
   - Check for spectating param, show banner when present
   - Modify `isAnswerLocked` to include spectator check
   - Hide submit button when spectating

4. **`src/screens/SubmittedScreen.tsx`**
   - Import SpectatorBanner and `useLocalSearchParams`
   - Check for spectating param, show banner when present

5. **`src/screens/ContestListScreen.tsx`**
   - Add "Spectate" button for in-progress contests (non-registered or eliminated)
   - Modify `handleEnterContest` to support spectate mode parameter
   - Update button logic and labels

## Verification

After implementation:
1. **Unit Tests:**
   - ContestRouter allows spectators through with param
   - GameScreen/SubmittedScreen show banner when param present
   - Answer submission disabled when spectating

2. **Integration Tests:**
   - Spectator flow end-to-end (eliminate → spectate → watch → leave)
   - Contest list spectate button functionality
   - Route params persist through navigation within contest

3. **Manual Verification:**
   - Eliminate user → Click "Continue as Spectator" → See banner + question on GameScreen
   - Cannot submit answers while spectating (buttons disabled/hidden)
   - Round transitions work (realtime updates spectators)
   - Leave button exits to contests cleanly
   - Navigate away and back → need to click "Spectate" again (no persistence)
   - Contest list "Spectate" button works for non-participants
   - URL contains `spectating=true` when in spectator mode
