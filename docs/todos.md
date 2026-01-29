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
  -- [x] Add football animation moving left-to-right underneath the question/answer card as waiting indicator.

- Eliminated Screen
  -- [x] Updated styling, show eliminated round and answer comparison.
  -- [x] Added ContestStatsCard for remaining players and round context.

- Winner Screen
  -- [x] Added celebratory styling + pulse animation and stats card.

Priority Fixes:

P1

- [x] Apple Auth setup
- [x] Notifications
  - [x] Finish testing
  - [ ] Make notifications auto-trigger based off time and contest tstate
- [x] Allow elimnated users to continue watching the contest as spectators
- [x] Add participant count to contest card
- [x] Use the active flag in the db to also make sure they were approved by the admin
  - [x] Update in app registration to show pending approval status and et to false by default
  - [x] Redirect user to www.sbhq.live to see rules (and potentially pay for the contest)

P2

- [x] Audit listneers and hooks, optimize where needed
- [x] Add first time login tutorial walk throguh for apple review team
- [x] Allow place for users to delete their account
- [x] Pull to refresh on contest list screeen
- [x] IOS haptic feedback
- [x] Pull to refresh on more screens to prevent stuckness
- [x] Settings bar to logout and change user settings
- [x] Supbase fixes:
  - [x] RLS policies?
  - [x] Cascade behvior for tables
- [x] Debug the answer summary container

P3

- [x] Create an icon for the app
- [ ] Offline error toast?
- [x] Add error logging for auto-send notifications
  - Issue: pg_net trigger calls edge function, but if it fails there's no visibility
  - Improvement: Create `notification_call_log` table to track pg_net responses
  - Add to `eliminate_incorrect_players()` trigger to log success/failure
  - Use for debugging if notifications don't arrive
- [x] Refactor lobby route to use path param instead of query param for consistency

P4 (Polish / Nice-to-haves)

- [x] Smart notification routing - route directly to final destination screen
  - Issue: RESULT_POSTED notifications route to `/game/{contestId}` (SubmittedScreen), then redirect to CorrectScreen/EliminatedScreen based on state
  - Causes brief flash of SubmittedScreen before final screen appears
  - Improvement: Have `useNotificationObserver` check participant state and route directly to correct destination
  - Routes: CORRECT → `/correct?contestId={id}`, ELIMINATED → `/eliminated?contestId={id}`, else `/game/{contestId}`
  - Low priority - current behavior is functional, just not as smooth
- [ ] Lobby screen tips:
  - [ ] Pull to refresh
  - [ ] Question can sometims have multiple correct answers
  - [ ] Submissions will close when play resumes
  - [ ] etc
