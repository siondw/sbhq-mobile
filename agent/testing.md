# SBHQ Mobile App — Testing Strategy

This repo’s tests should make it easy to validate **routing + contest flow sequencing + notification after-effects** without touching Supabase or a physical device.

## Principles

- **High signal over high volume:** avoid duplicated assertions and unrealistic edge cases.
- **Readable and maintainable:** tests should explain intent with minimal ceremony.
- **No fudging:** expected outcomes come from the intended UX/flow, not from “whatever the code currently does”.
- **Offline by default:** tests should run deterministically with mocked data and mocked platform APIs.
- **Production code stays stable:** keep changes under `tests/` unless a major test-architecture decision requires a production change and the user explicitly confirms it.

## What We Test First

1. **Contest flow sequencing (C)** — lobby → game → submitted → correct/eliminated → winner.
2. **Notification routing after-effects (D)** — the behavior after a user “taps” a notification (simulated in tests).

Login/onboarding/registration can follow later once the core state machine is reliable.

## Test Types

### Unit tests (pure logic)

Use unit tests for functions that have no side effects and are stable over time:

- `src/logic/contest/derivePlayerState.ts`
- `src/logic/notifications/deepLinks.ts`
- `src/utils/questionOptions.ts`

Unit tests should stay small and cover meaningful branches, not every imaginable input.

### Flow tests (scripted, offline)

Flow tests validate that multiple parts work together in a sequence:

- a scripted “contest timeline” (state changes over time)
- routing decisions (`expo-router` calls like `push`/`replace`)
- visible screen outcome (what the user would see)
- optional guardrails: rerender counts, repeated navigation, redundant “fetch” calls

Each flow test begins with a short comment describing:

- the scenario (“happy path: correct twice then win”)
- the expected route/screen sequence

### Hook/component behavior tests (targeted)

Use these sparingly for regressions that matter:

- `ContestRouter` redirect behavior (avoid wrong-screen flashes)
- `useNotificationObserver` behavior (tap handling, validation, pending intent)

Prefer behavior assertions over internal implementation details.

## Directory Structure

Keep test code separate from production code:

```text
tests/
  unit/        # pure functions
  flows/       # scripted offline scenarios
  mocks/       # shared fakes/mocks (expo-router, expo-notifications, timers)
```

## What “Good” Assertions Look Like

- **Sequence-based:** expected visible screen or expected route after each step.
- **No flicker:** no transient render of a wrong screen between steps (assert with stable screen markers).
- **No churn:** router calls are bounded (e.g. “no double replace”), and repeated fetches are avoided where possible.

Avoid brittle snapshots of entire screen trees unless there’s a strong reason.

## Mocking Guidelines

- Mock `expo-router` to record navigation calls and control `pathname`/params.
- Mock `expo-notifications` to emit “tap” events deterministically (no device required).
- Mock DB modules (`src/db/*`) in flow tests so everything runs offline.

Mocks belong in `tests/mocks/` and should be shared (no copy/paste per test file).

## Maintenance Expectations

- When the product flow changes, update tests to match the new intended behavior.
- If a test is hard to understand, refactor it before adding more scenarios.
- Add new flows by extending scripts, not by duplicating test logic.
