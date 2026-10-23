const CHANNEL_NAME = 'qhhoj-session';

/**
 * Tells the other tabs of this browser that the session ended here (logout), and calls `onSignedOut` when another tab says so:
 * a tab never learns it by itself, because the cookie is HttpOnly and nothing in the tab changes. No-op without BroadcastChannel.
 */
export function openSessionChannel(onSignedOut: () => void) {
  if (typeof BroadcastChannel === 'undefined') return { announceSignedOut: () => undefined };
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = onSignedOut;
  return { announceSignedOut: () => channel.postMessage('signed-out') };
}
