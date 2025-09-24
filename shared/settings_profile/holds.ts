export const USERNAME_HOLD_DURATION_MS = 24 * 60 * 60 * 1000;

export const computeUsernameHoldRelease = (now: number) =>
  now + USERNAME_HOLD_DURATION_MS;
