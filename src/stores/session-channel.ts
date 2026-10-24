const CHANNEL_NAME = 'qhhoj-session';
/** What a tab running an older build posts when it signs out. */
const LEGACY_SIGNED_OUT = 'signed-out';

/** The account another tab now holds (null: signed out), or undefined for a message that is not an announcement. */
function announcedUserId(message: unknown): string | null | undefined {
  if (message === LEGACY_SIGNED_OUT) return null;
  if (typeof message !== 'object' || message === null || !('userId' in message)) return undefined;
  const { userId } = message;
  return typeof userId === 'string' || userId === null ? userId : undefined;
}

/**
 * Tells the other tabs of this browser that the account changed here (signed in, signed out or switched), and calls
 * `onAnnounced` with the account another tab announces (null: signed out): a tab never learns it by itself, because
 * the cookie is HttpOnly and nothing in the tab changes. No-op without BroadcastChannel.
 */
export function openSessionChannel(onAnnounced: (userId: string | null) => void) {
  if (typeof BroadcastChannel === 'undefined') return { announce: () => undefined };
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event: MessageEvent) => {
    const userId = announcedUserId(event.data);
    if (userId !== undefined) onAnnounced(userId);
  };
  return { announce: (userId: string | null) => channel.postMessage({ userId }) };
}
