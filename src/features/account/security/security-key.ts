import { securityKeyCreationOptions, verifySecurityKey } from '@/api/account.api';
import type { SecurityKey } from '@/api/types/account';
import { isPromptCancelled, webauthnStatics } from '@/features/auth/passkey';

/** Chromium 129+, Safari 18.4+ and Firefox 119+ parse the backend's JSON options themselves (same rule as sign-in). */
interface CreationStatics {
  parseCreationOptionsFromJSON?: (options: object) => PublicKeyCredentialCreationOptions;
}

const statics = () => webauthnStatics<CreationStatics>();

export const canRegisterSecurityKey = () =>
  typeof statics()?.parseCreationOptionsFromJSON === 'function' &&
  typeof navigator.credentials?.create === 'function';

/** Options (password checked), the browser's prompt, then verify under `name`. Null when the viewer cancelled the prompt. */
export async function addSecurityKey(
  name: string,
  currentPassword: string,
): Promise<SecurityKey | null> {
  const options = await securityKeyCreationOptions(currentPassword);
  const publicKey = statics()!.parseCreationOptionsFromJSON!(options);
  let credential: Credential | null;
  try {
    credential = await navigator.credentials.create({ publicKey });
  } catch (error) {
    if (isPromptCancelled(error)) return null;
    throw error;
  }
  if (!credential) return null;
  return verifySecurityKey(
    name,
    (credential as unknown as { toJSON(): Record<string, unknown> }).toJSON(),
  );
}
