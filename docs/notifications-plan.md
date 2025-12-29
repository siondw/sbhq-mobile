# SBHQ Push Notifications Implementation Plan

## Overview

Add push notifications to the SBHQ mobile app using Expo Notifications with Supabase backend.

| Type | When | Deep Link |
|------|------|-----------|
| `STARTS_IN_10M` | 10 min before start | `/lobby` |
| `STARTS_IN_60S` | 60 sec before start | `/game/{contestId}` |
| `QUESTION_OPEN` | New round started | `/game/{contestId}?round={round}` |
| `RESULT_POSTED` | Correct answer set | `/game/{contestId}` |

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

- [ ] **7.1** Decide when to request permissions
  - [ ] After onboarding / first time account creation (can reuse the logic we use for shwoing the username modal, maybe we even make the modal multiple parts)

- [ ] **7.2** (If needed) Create permission prompt UI component
  - [ ] File: `src/ui/components/NotificationPermissionPrompt.tsx`

- [ ] **7.3** Integrate permission request into user flow

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
- [ ] **9.1** Test on physical iOS device
- [ ] **9.2** Test permission request flow

#### Token Registration
- [ ] **9.3** Verify token saved to users table after permission grant
- [ ] **9.4** Verify token updates on refresh
- [ ] **9.5** Verify token cleared on logout

#### Notification Display
- [ ] **9.6** Verify notifications suppressed when app is in foreground
- [ ] **9.7** Verify notifications show when app is in background
- [ ] **9.8** Verify notifications show when app is killed

#### Deep Linking
- [ ] **9.9** Tap notification â†’ navigates to correct screen (app in background)
- [ ] **9.10** Tap notification â†’ navigates to correct screen (app killed)
- [ ] **9.11** Test each notification type's deep link:
  - [ ] STARTS_IN_10M â†’ `/lobby`
  - [ ] STARTS_IN_60S â†’ `/game/{contestId}`
  - [ ] QUESTION_OPEN â†’ `/game/{contestId}?round={round}`
  - [ ] RESULT_POSTED â†’ `/game/{contestId}`

#### Edge Function
- [ ] **9.12** Test Edge Function via curl/Postman
- [ ] **9.13** Verify deduplication works (same notification not sent twice)
- [ ] **9.14** Verify notification_log entries created

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


