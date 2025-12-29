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

P2

- [x] Audit listneers and hooks, optimize where needed
- [ ] Pull to refresh on contest list screeen
- [ ] IOS haptic feedback
- [ ] UI Nits:
  - [ ] On round closed, if i bump the round number, before opening submissions again. the corect screen rerenders.
    - [ ] Decide behavior, should we change this form the db admin side and prevent that or fix on the UI side
- [ ] Question to solve:
  - [ ] What if we get to a state where the final 2 users both get the wrong answer. How do we prevent against them both being eliminated?
    - [ ] Or should we add capabilities to reinstate an entire round from the adming ide 

P3

- [ ] Consolidate participant lookup into a single call (avoid double fetch in getParticipantForUser/getOrCreateParticipant).
      Logging (debug-only)
