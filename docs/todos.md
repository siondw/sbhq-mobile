UI Nits:

- Contest List Screen
  -- [x] Show live indicator for all statuses besides Upcoming/Finished (finished filtered, live badge for lobby/in-progress/closed).
  -- [x] Format start time in EST via Intl formatter (no undefined timezone).
  -- [x] Join button shows arrow suffix, no checkmark.
  -- [x] Registered button has no icon (label only).

- Lobby Screen
  -- [x] Route from lobby to the correct screen when contest is in progress (uses playerState redirects).

- Question Screen / GameScreen
  -- [x] Restyled layout with prominent round header and �Choose Wisely!� prompt.
  -- [x] Removed contest name and player state text.
  -- [x] Answer selection no longer auto-submits; added separate Submit button.
  -- [x] Removed orange selection state; uses subtle border highlight.
  -- [x] Submit uses option values to match correct_option behavior from the old app.

- Submitted Screen
  -- [x] Removed full white container; only summary card uses surface background.
  -- [x] Added question + selected answer summary via reusable AnswerSummaryCard.
  -- [ ] Add football animation moving left-to-right underneath the question/answer card as waiting indicator.

- Eliminated Screen
  -- [x] Updated styling, show eliminated round and answer comparison.
  -- [x] Added ContestStatsCard for remaining players and round context.

- Winner Screen
  -- [x] Added celebratory styling + pulse animation and stats card.

Priority Fixes:

P1

- [x] Apple Auth setup
- [ ] Notifications
  - [ ] Finish testing
  - [ ] Make notifications auto-trigger based off time and contes tstate
- [ ] Allow elimnated users to continue watching the contest as spectators

P2

- [x] Audit listneers and hooks, optimize where needed
- [x] Pull to refresh on contest list screeen
- [x] IOS haptic feedback
- [ ] Settings bar to logout and change user settings
- [ ] Supbase fixes:
  - [ ] RLS policies?
  - [x] Cascade behvior for tables
- [ ] UI Nits:
  - [ ] On round closed, if i bump the round number, before opening submissions again. the 'CorrectScreen' rerenders.
    - [ ] Decide behavior, should we change this form the db admin side and prevent that or fix on the UI side
- [ ] Question to solve:
  - [ ] What if we get to a state where the final 2 users both get the wrong answer. How do we prevent against them both being eliminated?
    - [x] Or should we add capabilities to reinstate an entire round from the admin side

P3

- [ ] Consolidate participant lookup into a single call (avoid double fetch in getParticipantForUser/getOrCreateParticipant).
      Logging (debug-only)
- [x] Create an icon for the app
- [ ] Add error logging for auto-send notifications
  - Issue: pg_net trigger calls edge function, but if it fails there's no visibility
  - Improvement: Create `notification_call_log` table to track pg_net responses
  - Add to `eliminate_incorrect_players()` trigger to log success/failure
  - Use for debugging if notifications don't arrive
- [ ] Optimize usePushNotifications dependency chain
  - Issue: `refreshPermissions` effect triggers 2-3 times on auth due to dependency chain (user.id → registerToken → refreshPermissions → effect)
  - Current behavior: Makes 2-3 registration calls on login (guarded to prevent infinite loop)
  - Possible fix: Use mount-only effect with ref tracking, or restructure to eliminate circular deps
  - Status: Ignored for now - only happens once per user session, guard prevents runaway costs
- [x] Refactor lobby route to use path param instead of query param for consistency



P4 (Polish / Nice-to-haves)

- [ ] Smart notification routing - route directly to final destination screen
  - Issue: RESULT_POSTED notifications route to `/game/{contestId}` (SubmittedScreen), then redirect to CorrectScreen/EliminatedScreen based on state
  - Causes brief flash of SubmittedScreen before final screen appears
  - Improvement: Have `useNotificationObserver` check participant state and route directly to correct destination
  - Routes: CORRECT → `/correct?contestId={id}`, ELIMINATED → `/eliminated?contestId={id}`, else `/game/{contestId}`
  - Low priority - current behavior is functional, just not as smooth

- [ ] Fix DevLandingScreen flash when opening app from killed state via notification (dev mode only)
  - Issue: Brief flash of DevLandingScreen (~100-200ms) while auth loads, then routes to notification deep link target
  - Only occurs in dev mode - production auto-redirects to `/contests` (IndexScreen.tsx:18-20)
  - Fix: Track "processing notification" state in useNotificationObserver, expose via context, show LoadingView in IndexScreen while processing
  - Implementation: Add NotificationStateContext (~10 lines), track `isProcessingNotification` boolean, check in IndexScreen before showing DevLandingScreen
  - Low priority since it's dev-only and <200ms duration
