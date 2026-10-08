import { Fingerprint, KeyRound, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-vue-next';
import type { SecondFactorMethod } from '@/api/types/auth';

/** What the viewer chose to use; the page starts on the app code when the account has one. */
export type SecondFactorMode = 'app' | 'backup' | 'key';
export type TwoFactorView = SecondFactorMode | 'keyUnsupported' | 'sessionChanged';

/** Which card to show (Decision 9): only the account's factors, and only a key the browser can use. */
export function twoFactorView(
  methods: readonly SecondFactorMethod[],
  keySupported: boolean,
  mode: SecondFactorMode,
): TwoFactorView {
  if (methods.length === 0) return 'sessionChanged';
  const hasCode = methods.includes('totp');
  const keyUsable = methods.includes('webauthn') && keySupported;
  if (!hasCode) return keyUsable ? 'key' : 'keyUnsupported';
  return mode === 'key' && !keyUsable ? 'app' : mode;
}

/** TwoFactorA and TwoFactorStates: title, explanation (with the role a dead end is announced with) and badge, per view. */
export const TWO_FACTOR_CARDS = {
  app: {
    titleKey: 'auth.twoFactor.title',
    leadKey: 'auth.twoFactor.leadApp',
    leadRole: undefined,
    tone: 'accent',
    icon: ShieldCheck,
  },
  backup: {
    titleKey: 'auth.twoFactor.backupTitle',
    leadKey: 'auth.twoFactor.backupLead',
    leadRole: undefined,
    tone: 'accent',
    icon: KeyRound,
  },
  key: {
    titleKey: 'auth.twoFactor.keyTitle',
    leadKey: 'auth.twoFactor.keyLead',
    leadRole: undefined,
    tone: 'accent',
    icon: Fingerprint,
  },
  keyUnsupported: {
    titleKey: 'auth.twoFactor.unsupportedTitle',
    leadKey: 'auth.twoFactor.unsupportedLead',
    leadRole: 'alert',
    tone: 'warning',
    icon: TriangleAlert,
  },
  sessionChanged: {
    titleKey: 'auth.twoFactor.sessionChangedTitle',
    leadKey: 'auth.twoFactor.sessionChangedLead',
    leadRole: 'alert',
    tone: 'negative',
    icon: ShieldAlert,
  },
} as const;
