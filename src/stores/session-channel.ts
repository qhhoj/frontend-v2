const CHANNEL_NAME = 'qhhoj-session';
/** The fallback for a browser without BroadcastChannel: other tabs hear a write to this key as a `storage` event. */
const STORAGE_KEY = 'qhhoj.sessionAnnouncement';
/** What a tab running an older build posts when it signs out. */
const LEGACY_SIGNED_OUT = 'signed-out';

/** The account another tab now holds (null: signed out), or undefined for a message that is not an announcement. */
function announcedUserId(message: unknown): string | null | undefined {
  if (message === LEGACY_SIGNED_OUT) return null;
  if (typeof message !== 'object' || message === null || !('userId' in message)) return undefined;
  const { userId } = message;
  return typeof userId === 'string' || userId === null ? userId : undefined;
}

function parseStored(value: string | null): unknown {
  try {
    return value === null ? undefined : JSON.parse(value);
  } catch {
    return undefined;
  }
}

/** BroadcastChannel where the browser has it, otherwise localStorage writes heard as `storage` events. */
function openTransport(receive: (message: unknown) => void) {
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event: MessageEvent) => receive(event.data);
    return (message: object) => channel.postMessage(message);
  }
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) receive(parseStored(event.newValue));
  });
  return (message: object) => {
    try {
      // The time makes every write a change, so a repeated announcement still fires the event.
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...message, at: Date.now() }));
    } catch {
      // Storage blocked: the other tabs learn of the change on their next request.
    }
  };
}

/**
 * Tells the other tabs of this browser that the account changed here (signed in, signed out or switched), and calls
 * `onAnnounced` with the account another tab announces (null: signed out): a tab never learns it by itself, because
 * the cookie is HttpOnly and nothing in the tab changes.
 */
export function openSessionChannel(onAnnounced: (userId: string | null) => void) {
  const post = openTransport((message) => {
    const userId = announcedUserId(message);
    if (userId !== undefined) onAnnounced(userId);
  });
  return { announce: (userId: string | null) => post({ userId }) };
}
