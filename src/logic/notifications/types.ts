export const NOTIFICATION_TYPES = {
  STARTS_IN_10M: 'STARTS_IN_10M',
  STARTS_IN_60S: 'STARTS_IN_60S',
  QUESTION_OPEN: 'QUESTION_OPEN',
  RESULT_POSTED: 'RESULT_POSTED',
  RESULT_CORRECT: 'RESULT_CORRECT',
  RESULT_ELIMINATED: 'RESULT_ELIMINATED',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export interface NotificationData {
  url: string;
  contestId: string;
  round?: number;
  type: NotificationType;
}
