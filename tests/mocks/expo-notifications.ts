export const DEFAULT_ACTION_IDENTIFIER = 'expo.modules.notifications.actions.DEFAULT';

export type NotificationResponse = {
  actionIdentifier: string;
  notification: {
    request: {
      identifier: string;
      content: { data: unknown };
    };
  };
};

type Listener = (response: NotificationResponse | null) => void;

let lastResponse: NotificationResponse | null = null;
let listeners: Listener[] = [];

export const getLastNotificationResponseAsync = async () => lastResponse;

export const addNotificationResponseReceivedListener = (listener: Listener) => {
  listeners.push(listener);
  return {
    remove: () => {
      listeners = listeners.filter((l) => l !== listener);
    },
  };
};

export const __notifications = {
  reset: () => {
    lastResponse = null;
    listeners = [];
  },
  setLastResponse: (response: NotificationResponse | null) => {
    lastResponse = response;
  },
  emitResponse: (response: NotificationResponse) => {
    for (const listener of listeners) {
      listener(response);
    }
  },
  makeResponseWithUrl: (url: string, identifier: string = 'test-notification') =>
    ({
      actionIdentifier: DEFAULT_ACTION_IDENTIFIER,
      notification: {
        request: {
          identifier,
          content: {
            data: { url },
          },
        },
      },
    }) satisfies NotificationResponse,
};

