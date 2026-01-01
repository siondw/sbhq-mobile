# SBHQ Push Notifications Implementation Plan

## Overview

Add push notifications to the SBHQ mobile app using Expo Notifications with Supabase backend.

| Type | When | Deep Link |
|------|------|-----------|
| `STARTS_IN_10M` | 10 min before start | `/lobby/{contestId}` |
| `STARTS_IN_60S` | 60 sec before start | `/lobby/{contestId}` |
| `QUESTION_OPEN` | New round started | `/game/{contestId}?round={round}` |
| `RESULT_POSTED` | Correct answer set (auto-sends RESULT_CORRECT/RESULT_ELIMINATED) | `/game/{contestId}` |
| `RESULT_CORRECT` | User answered correctly | `/correct/{contestId}` |
| `RESULT_ELIMINATED` | User eliminated this round | `/eliminated/{contestId}?round={round}` |

---

## Implementation Checklist

### Phase 1: Database Migrations
> Apply via Supabase MCP (`mcp__supabase__apply_migration`)

- [x] **1.1** Add push token columns to users table
  ```sql
  ALTER TABLE public.users
  ADD COLUMN expo_push_token TEXT,
  ADD COLUMN push_token_updated_at TIMESTAMPTZ;
  ```

- [x] **1.2** Add index for token lookups
  ```sql
  CREATE INDEX idx_users_push_token ON public.users(expo_push_token)
  WHERE expo_push_token IS NOT NULL;
  ```

- [x] **1.3** Create notification_log table for deduplication
  ```sql
  CREATE TABLE public.notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dedupe_key TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    contest_id UUID REFERENCES public.contests(id) ON DELETE CASCADE,
    round INTEGER,
    sent_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX idx_notification_log_dedupe ON public.notification_log(dedupe_key);
  ```

- [x] **1.4** Verify migrations applied successfully

---

### Phase 2: Dependencies & Configuration

- [x] **2.1** Install expo-notifications
  ```bash
  npx expo install expo-notifications expo-device
  ```
---

### Phase 3: Database Layer (src/db/)

- [x] **3.1** Regenerate Supabase types
  ```bash
  npx supabase gen types typescript --project-id <project-id> > src/db/types.ts
  ```

- [x] **3.2** Verify UserRow type includes new columns
  - [x] `expo_push_token: string | null`
  - [x] `push_token_updated_at: string | null`

- [x] **3.3** Add `updatePushToken` function to `src/db/users.ts`
  ```typescript
  export const updatePushToken = async (
    userId: string,
    token: string
  ): AsyncResult<UserRow, DbError>
  ```

- [x] **3.4** Add `clearPushToken` function to `src/db/users.ts`
  ```typescript
  export const clearPushToken = async (
    userId: string
  ): AsyncResult<void, DbError>
  ```

---

### Phase 4: Logic Layer - Types & Constants

- [x] **4.1** Create `src/logic/notifications/` directory

- [x] **4.2** Create `src/logic/notifications/types.ts`
  - [x] Define `NOTIFICATION_TYPES` constant
    ```typescript
    export const NOTIFICATION_TYPES = {
      STARTS_IN_10M: 'STARTS_IN_10M',
      STARTS_IN_60S: 'STARTS_IN_60S',
      QUESTION_OPEN: 'QUESTION_OPEN',
      RESULT_POSTED: 'RESULT_POSTED',
    } as const;
    ```
  - [x] Define `NotificationType` type
  - [x] Define `NotificationData` interface
    ```typescript
    export interface NotificationData {
      url: string;
      contestId: string;
      round?: number;
      type: NotificationType;
    }
    ```

- [x] **4.3** Create `src/logic/notifications/constants.ts`
  - [x] Define notification-related constants (if needed)

- [x] **4.4** Create `src/logic/notifications/deepLinks.ts`
  - [x] Implement `getDeepLinkForNotification(type, contestId, round)`
  - [x] Implement `isValidNotificationUrl(url)`

- [x] **4.5** Create barrel export `src/logic/notifications/index.ts`

---

### Phase 5: Logic Layer - Hooks

- [x] **5.1** Create `src/logic/hooks/usePushNotifications.ts`
  - [x] Import expo-notifications, expo-device, expo-constants
  - [x] Implement `getExpoPushToken()` to get Expo push token
  - [x] Implement `registerToken()` to save token to Supabase
  - [x] Implement `requestPermissions()` function (iOS-specific permissions)
  - [x] Set up `addNotificationReceivedListener` (foreground)
  - [x] Set up `addNotificationResponseReceivedListener` (tap)
  - [x] Set up `addPushTokenListener` (token refresh)
  - [x] Handle `getLastNotificationResponse()` (app opened via notification)
  - [x] Clean up listeners on unmount
  - [x] Return: `{ expoPushToken, permissionStatus, error, requestPermissions, isRegistered }`

- [x] **5.2** Create `src/logic/hooks/useNotificationObserver.ts`
  - [x] Handle initial notification on app launch
  - [x] Listen for notification taps
  - [x] Navigate using `router.push(url)` from expo-router
  - [x] Validate URL before navigating

---

### Phase 6: Root Layout Integration

- [x] **6.1** Update `app/_layout.tsx` - Add notification handler
  - [x] File: `app/_layout.tsx`
  - [x] Add at module level (before component):
    ```typescript
    import * as Notifications from 'expo-notifications';

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    ```

- [x] **6.2** Update `app/_layout.tsx` - Add notification observer
  - [x] Import `useNotificationObserver`
  - [x] Call `useNotificationObserver()` inside `RootLayoutNav`

- [ ] **6.3** (Optional) Create `NotificationProvider` context
  - [ ] File: `src/logic/contexts/NotificationContext.tsx`
  - [ ] Wrap app with provider for global access to notification state

---

### Phase 7: Permission Request Flow

- [x] **7.1** Decide when to request permissions
  - [x] Added checkbox to OnboardingModal: "Notify me when my contests start and new rounds begin"
  - [x] Permission requested on form submit if checkbox is checked (default: checked)

- [x] **7.2** (If needed) Create permission prompt UI component
  - [x] Integrated directly into OnboardingModal as a checkbox (no separate component needed)

- [x] **7.3** Integrate permission request into user flow
  - [x] OnboardingModal calls `usePushNotifications().requestPermissions()` on submit
  - [x] Token is automatically saved to Supabase when permission granted

---

### Phase 8: Edge Function (Backend) - Expo Push Service

- [x] **8.1** Create `send-notification` Edge Function  
  - [x] Deploy via: `mcp__supabase__deploy_edge_function`  
  - [x] Accepts POST body:
    ```ts
    {
      contestId: string,
      type: 'STARTS_IN_10M' | 'STARTS_IN_60S' | 'QUESTION_OPEN' | 'RESULT_POSTED',
      round?: number,
      targetUserIds?: string[] // optional override
    }
    ```

- [x] **8.2** Implement recipient + token query (active participants only)
  - [x] Select from `participants`
    - [x] `contest_id = contestId`
    - [x] `elimination_round IS NULL` (still active)
  - [x] Join `participants.user_id -> users.id`
  - [x] Filter `users.expo_push_token IS NOT NULL`
  - [x] If `targetUserIds` provided, restrict to those users

- [x] **8.3** Implement idempotent send (lightweight dedupe + log)
  - [x] Build `dedupe_key`:
    - [x] `{contestId}:{userId}:{type}`
    - [x] `{contestId}:{userId}:round_{round}:{type}` (round-specific)
  - [x] For each recipient:
    1) **Attempt to insert** a row into `notification_log` with `dedupe_key` (unique)
    2) If insert **fails** due to duplicate key -> **skip sending** (already handled)
    3) If insert **succeeds** -> proceed to send push
  - [ ] (Optional) If the push send fails, update the log row with `status='failed'` / `error` or delete the row

- [x] **8.4** Implement Expo Push API call
  - [x] Endpoint: `https://exp.host/--/api/v2/push/send`
  - [x] Batch up to 100 notifications per request
  - [x] Payload includes:
    - [x] `to: expo_push_token`
    - [x] `title`, `body`
    - [x] `data: { url, contestId, round?, type }`
    - [x] `sound: 'default'`
    - [x] `priority: 'high'`

- [x] **8.5** Implement notification logging (via 8.3 insert)
  - [x] `notification_log` row created **before** sending (idempotency gate):
    - [x] `dedupe_key` (UNIQUE)
    - [x] `user_id`
    - [x] `contest_id`
    - [x] `round`
    - [x] `notification_type`
    - [x] `sent_at` (or `created_at`)
  - [ ] (Optional) Add columns later: `status`, `error`, `expo_ticket_id`

- [x] **8.6** Define notification content templates
  ```ts
  STARTS_IN_10M: {
    title: 'Contest starting soon!',
    body: 'Starts in 10 minutes.'
  },
  STARTS_IN_60S: {
    title: 'Starting now!',
    body: 'Starts in 60 seconds.'
  },
  QUESTION_OPEN: {
    title: 'New question!',
    body: 'Round {round} is live!'
  },
  RESULT_POSTED: {
    title: 'Results are in!',
    body: 'Check if you got it right.'
  }

---

### Phase 9: Testing (Optional, dont complete, let user handle)

#### Device Testing
- [x] **9.1** Test on physical iOS device
- [x] **9.2** Test permission request flow

#### Token Registration
- [x] **9.3** Verify token saved to users table after permission grant
- [ ] **9.4** Verify token updates on refresh
- [ ] **9.5** Verify token cleared on logout

#### Notification Display
- [ ] **9.6** Verify notifications suppressed when app is in foreground
- [ ] **9.7** Verify notifications show when app is in background
- [ ] **9.8** Verify notifications show when app is killed

#### Deep Linking
- [ ] **9.9** Tap notification → navigates to correct screen (app in background)
- [ ] **9.10** Tap notification → navigates to correct screen (app killed)
- [ ] **9.11** Test each notification type's deep link:
  - [ ] STARTS_IN_10M → `/lobby`
  - [ ] STARTS_IN_60S → `/game/{contestId}`
  - [ ] QUESTION_OPEN → `/game/{contestId}?round={round}`
  - [ ] RESULT_POSTED → `/game/{contestId}`

#### Edge Function
- [x] **9.12** Test Edge Function via curl/Postman
- [x] **9.13** Verify deduplication works (same notification not sent twice)
- [x] **9.14** Verify notification_log entries created

---

### Phase 10: Refactor to useFocusEffect

- [x] **10.1** Update useContestState to use useFocusEffect
  - Import `useFocusEffect` from expo-router
  - Add focus effect that calls `fetchContestState()` when screen gains focus
  - Remove timestamp-based refresh mechanism (lastNavigationTimestamp effect)
  - Remove `lastRefreshTimestampRef` and `isRefreshingRef` refs

- [x] **10.2** Simplify NotificationContext
  - Remove `lastNavigationTimestamp` state
  - Remove `triggerRefresh` function
  - Update `NotificationContextValue` interface

- [x] **10.3** Update useNotificationObserver
  - Remove `triggerRefresh` import and calls
  - Routing still works - useFocusEffect handles data refresh on navigation

---

### Phase 11: Auto-Send Result Notifications with Separate Routes

- [x] **11.1** Enable pg_net extension and modify elimination trigger
  - [x] Deploy migration via `mcp__supabase__apply_migration`
  - [x] Enable `CREATE EXTENSION IF NOT EXISTS pg_net`
  - [x] Modify `eliminate_incorrect_players()` to call edge function via `net.http_post()`
  - [x] Edge function called automatically when admin sets correct answer

- [x] **11.2** Deploy updated edge function (v6+)
  - [x] Add `RESULT_CORRECT` and `RESULT_ELIMINATED` notification types
  - [x] When `type === 'RESULT_POSTED'`:
    - [x] Query participants with `elimination_round IS NULL` (correct users) → send `RESULT_CORRECT`
    - [x] Query participants with `elimination_round = round` (eliminated users) → send `RESULT_ELIMINATED`
  - [x] Update `getNotificationUrl()` for new types
  - [x] Update `getNotificationTemplate()` - both types show "Results posted"
  - [x] Update dedupe keys for new types

- [x] **11.3** Create client-side routes
  - [x] New: `app/(contest)/correct/[contestId].tsx` → renders `CorrectScreen`
  - [x] New: `app/(contest)/eliminated/[contestId].tsx` → renders `EliminatedScreen`

- [x] **11.4** Update client notification types and constants
  - [x] Add `RESULT_CORRECT` and `RESULT_ELIMINATED` to `NOTIFICATION_TYPES`
  - [x] Add `CORRECT_ROOT` and `ELIMINATED_ROOT` to `NOTIFICATION_URLS`

- [x] **11.5** Update deep link utilities
  - [x] `getDeepLinkForNotification()` - handle new types with correct paths
  - [x] `isValidNotificationUrl()` - validate `/correct/` and `/eliminated/` paths
  - [x] `extractContestIdFromUrl()` - extract contest ID from new paths

---

## File Summary

| File | Status | Action |
|------|--------|--------|
| `app.json` | Update | Add expo-notifications plugin |
| `app/_layout.tsx` | Update | Add handler + observer |
| `src/db/types.ts` | Regenerate | Include new user columns |
| `src/db/users.ts` | Update | Add updatePushToken, clearPushToken |
| `src/logic/notifications/types.ts` | New | Type definitions |
| `src/logic/notifications/constants.ts` | New | Channel config |
| `src/logic/notifications/deepLinks.ts` | New | Deep link utilities |
| `src/logic/hooks/usePushNotifications.ts` | New | Main notification hook |
| `src/logic/hooks/useNotificationObserver.ts` | New | Deep link observer |
| `src/ui/components/OnboardingModal.tsx` | Updated | Added notification opt-in checkbox |
| Edge Function `send-notification` | New | Backend push sender |

---

## Quick Reference

### Dedupe Key Format
```
{contestId}:{userId}:starts_in_10m
{contestId}:{userId}:starts_in_60s
{contestId}:{userId}:round_{round}:open
{contestId}:{userId}:round_{round}:result
```

### Expo Push Payload Format
```typescript
{
  to: 'ExponentPushToken[xxx]',
  title: 'Notification Title',
  body: 'Notification body text',
  data: {
    url: '/game/abc123?round=2',
    contestId: 'abc123',
    round: 2,
    type: 'QUESTION_OPEN'
  },
  sound: 'default',
  priority: 'high'
}
```

### iOS Foreground Behavior
```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,  // Don't show when app is open
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});
```


