import { webauthnLoginOptions, webauthnLoginVerify } from '@/api/auth.api';

/** Chromium 129+, Safari 18.4+ and Firefox 119+ parse the backend's JSON options themselves; older browsers hide the button. */
interface PasskeyStatics {
  parseRequestOptionsFromJSON?: (options: object) => PublicKeyCredentialRequestOptions;
}
const statics = () =>
  typeof PublicKeyCredential === 'undefined'
    ? null
    : (PublicKeyCredential as unknown as PasskeyStatics);

export const isPasskeySupported = () =>
  typeof statics()?.parseRequestOptionsFromJSON === 'function' &&
  typeof navigator.credentials?.get === 'function';

export type PasskeyOutcome = 'verified' | 'not-needed' | 'cancelled';
const CANCELLED_PROMPTS = ['NotAllowedError', 'AbortError'];

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
    if (error instanceof DOMException && CANCELLED_PROMPTS.includes(error.name)) return 'cancelled';
    throw error;
  }
  if (!credential) return 'cancelled';
  await webauthnLoginVerify((credential as unknown as { toJSON(): object }).toJSON());
  return 'verified';
}
