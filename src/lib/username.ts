/** Mirrors the backend's `RegisterDto.username`: `^\w+$` (ASCII letters, digits, underscore), at most 30 characters. */
export const USERNAME_MAX_LENGTH = 30;
export type UsernameProblem = 'format' | 'length';

/** An empty field has no problem here: `required` covers it. */
export function usernameProblem(username: string): UsernameProblem | null {
  if (username === '') return null;
  if (username.length > USERNAME_MAX_LENGTH) return 'length';
  return /^\w+$/.test(username) ? null : 'format';
}
