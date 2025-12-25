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

- Eliminated Screen
  -- [x] Updated styling, show eliminated round and answer comparison.
  -- [x] Added ContestStatsCard for remaining players and round context.

- Winner Screen
  -- [x] Added celebratory styling + pulse animation and stats card.

Priority Fixes:

P3

- [ ] Consolidate participant lookup into a single call (avoid double fetch in getParticipantForUser/getOrCreateParticipant).
      Logging (debug-only)
- [x] Document logging rules (use src/utils/debug.ts, prefix tags, remove before merge).
- [x] Remove debug logs once auth issue is resolved (AuthProvider/useContests/useContestRegistration/LoginScreen/IndexScreen/db/contests).
- [x] Add contests fetch timing logs to isolate auth race on mobile.
- [x] Add contests REST probe logs to compare Supabase query vs direct fetch.
- [x] Add Supabase fetch logging wrapper for request start/end timing.
- [x] Add app state change auth logs to validate resume timing.
- [x] Add AsyncStorage logging wrapper to trace auth session hydration.
- [x] Add getSession timing logs for contests query to identify auth lock.
