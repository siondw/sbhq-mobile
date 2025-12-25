export const debugRoute = (screen: string, payload: Record<string, unknown>): void => {
  if (!__DEV__) return;
  console.warn(`[route] ${screen}`, payload);
};
