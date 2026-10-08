import { webauthnLoginOptions, webauthnLoginVerify } from '@/api/auth.api';

/** Chromium 129+, Safari 18.4+ and Firefox 119+ parse the backend's JSON options themselves; older browsers hide the button. */
interface PasskeyStatics {
  parseRequestOptionsFromJSON?: (options: object) => PublicKeyCredentialRequestOptions;
}

/** `PublicKeyCredential` with the static helpers `Statics` names, or null when the browser has no WebAuthn at all. */
export const webauthnStatics = <Statics extends object>() =>
  typeof PublicKeyCredential === 'undefined' ? null : (PublicKeyCredential as unknown as Statics);

const statics = () => webauthnStatics<PasskeyStatics>();

export const isPasskeySupported = () =>
  typeof statics()?.parseRequestOptionsFromJSON === 'function' &&
  typeof navigator.credentials?.get === 'function';

export type PasskeyOutcome = 'verified' | 'not-needed' | 'cancelled';
const CANCELLED_PROMPTS = ['NotAllowedError', 'AbortError'];

/** The viewer closed the browser's prompt or let it time out: not an error. */
export const isPromptCancelled = (error: unknown) =>
  error instanceof DOMException && CANCELLED_PROMPTS.includes(error.name);

/**
 * Second factor through the browser's WebAuthn API: the backend issues the challenge (stored in the session), the
 * browser signs it, the backend verifies. A cancelled or timed-out prompt is not an error.
 */
export async function signInWithPasskey(): Promise<PasskeyOutcome> {
  const options = await webauthnLoginOptions();
  if (!options) return 'not-needed'; // the session already passed its second factor
  const publicKey = statics()!.parseRequestOptionsFromJSON!(options);
  let credential: Credential | null;
  try {
    credential = await navigator.credentials.get({ publicKey });
  } catch (error) {
    if (isPromptCancelled(error)) return 'cancelled';
    throw error;
  }
  if (!credential) return 'cancelled';
  await webauthnLoginVerify((credential as unknown as { toJSON(): object }).toJSON());
  return 'verified';
}
