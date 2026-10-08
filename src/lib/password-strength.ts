/**
 * A local estimate for the meter only. It mirrors the backend's `passwordProblems` (`libs/auth/src/password/password-policy.ts`:
 * at least 8 characters, not all digits, not containing the username or the email name of 3+ characters), which stays the
 * authority, plus a length-and-variety score. The breached-password check happens on the backend.
 */
export const PASSWORD_MIN_LENGTH = 8;
export type PasswordScore = 0 | 1 | 2 | 3 | 4;
export interface PasswordOwner {
  username?: string;
  email?: string;
}

const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  'qwertyui',
  'qwerty123',
  'qwertyuiop',
  'iloveyou',
  'letmein1',
  'welcome1',
  'abc12345',
  'admin123',
  '11111111',
  'matkhau123',
]);
const CHARACTER_CLASSES = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/];
/** Points needed for scores 2, 3 and 4. */
const SCORE_THRESHOLDS = [11, 15, 19];

const identitiesOf = ({ username = '', email = '' }: PasswordOwner) =>
  [username, email.split('@')[0] ?? '']
    .filter((identity) => identity.length >= 3)
    .map((identity) => identity.toLowerCase());

/** What the backend refuses (or a common password): never more than "weak". */
function isRejected(password: string, owner: PasswordOwner): boolean {
  const lowered = password.toLowerCase();
  return (
    password.length < PASSWORD_MIN_LENGTH ||
    /^\d+$/.test(password) ||
    COMMON_PASSWORDS.has(lowered) ||
    identitiesOf(owner).some((identity) => lowered.includes(identity))
  );
}

export function estimatePasswordStrength(
  password: string,
  owner: PasswordOwner = {},
): PasswordScore {
  if (!password) return 0;
  if (isRejected(password, owner)) return 1;
  const classes = CHARACTER_CLASSES.filter((pattern) => pattern.test(password)).length;
  // Repeated characters add little: at most two points per distinct character.
  const points = Math.min(password.length, new Set(password).size * 2) + 2 * (classes - 1);
  return (1 + SCORE_THRESHOLDS.filter((threshold) => points >= threshold).length) as PasswordScore;
}
