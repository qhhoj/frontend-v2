import { NO_VALUE } from './format';

/** Who did it: the username, or a dash when the backend sends `null` (a system entry or a user that no longer exists). */
export const actorName = (actor: { username: string } | null): string =>
  actor === null ? NO_VALUE : actor.username;
