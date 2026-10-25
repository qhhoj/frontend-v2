<script setup lang="ts">
import { Fingerprint, LoaderCircle, LogOut } from 'lucide-vue-next';
import { computed, nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';
import { verifyTotp } from '@/api/auth.api';
import { ApiError } from '@/api/client';
import InlineBit from '@/components/InlineBit.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { OTP_LENGTH, normalizeBackupCode } from '@/lib/otp';
import { useSessionStore } from '@/stores/session.store';
import { useLogout } from './use-logout';
import AuthBadge from './AuthBadge.vue';
import AuthError from './AuthError.vue';
import AuthField from './AuthField.vue';
import AuthLayout from './AuthLayout.vue';
import AuthSubmit from './AuthSubmit.vue';
import OtpInput from './OtpInput.vue';
import { isPasskeySupported, signInWithPasskey } from './passkey';
import { TWO_FACTOR_CARDS, isKeyUsable, twoFactorView } from './two-factor-view';
import type { SecondFactorMode } from './two-factor-view';
import { useAfterSignIn } from './use-after-sign-in';
import { useAuthAction } from './use-auth-action';
import { AUTH_LINK } from './auth-link';

const session = useSessionStore();
const router = useRouter();
const afterSignIn = useAfterSignIn(true);
/** A partial session without the member is treated like `methods: []`: sign in again. */
const methods = computed(() => session.twoFactor?.methods ?? []);
const username = computed(() => session.twoFactor?.username ?? '');
const hasCode = computed(() => methods.value.includes('totp'));
const keySupported = isPasskeySupported();
const keyUsable = computed(() => isKeyUsable(methods.value, keySupported));
const mode = ref<SecondFactorMode>(hasCode.value ? 'app' : 'key');
const view = computed(() => twoFactorView(methods.value, keySupported, mode.value));
const card = computed(() => TWO_FACTOR_CARDS[view.value]);
const digits = ref('');
const backupCode = ref('');
const keyAttempted = ref(false);
const otp = ref<{ focus: () => void } | null>(null);
/** An `AppButton`; its root element takes the focus. */
const keyButton = ref<{ $el: HTMLElement } | null>(null);
/** The wrong-code text's id: the six boxes point at it while the code is refused. */
const CODE_ERROR_ID = 'two-factor-code-error';
const formElement = ref<HTMLFormElement | null>(null);
const { pending, error, fieldErrors, summary, run } = useAuthAction(formElement, ['code']);
const waitingForKey = computed(() => view.value === 'key' && pending.value);
/** Only a refused code marks the boxes and empties them; a network error or a 429 keeps what was typed. */
const wrongCode = computed(
  () => error.value instanceof ApiError && error.value.code === 'invalid_code',
);
const codeInvalid = computed(() => view.value === 'app' && wrongCode.value);
/** A failed attempt or a dead end: Bit sweats in place of the card's icon. */
const failed = computed(
  () =>
    Boolean(summary.value) || view.value === 'keyUnsupported' || view.value === 'sessionChanged',
);

/** Any accepted factor flips the server session to authenticated; reload it, then leave like a password sign-in. */
const finish = async () => {
  await session.refresh();
  await afterSignIn();
};

/** Codes that mean the factor was removed in another tab; the session is reloaded so the cards match the account. */
const FACTOR_GONE_CODES: readonly string[] = ['totp_not_enabled', 'webauthn_not_enabled'];

async function refreshIfFactorGone(attempt: () => Promise<void>): Promise<void> {
  try {
    await attempt();
  } catch (caught) {
    if (caught instanceof ApiError && FACTOR_GONE_CODES.includes(caught.code))
      await session.refresh();
    throw caught;
  }
}

async function submitCode() {
  if (pending.value) return;
  if (mode.value === 'app' && digits.value.length < OTP_LENGTH) return otp.value?.focus();
  const code = mode.value === 'app' ? digits.value : normalizeBackupCode(backupCode.value);
  const accepted = await run(() =>
    refreshIfFactorGone(async () => {
      await verifyTotp(code);
      await finish();
    }),
  );
  if (accepted || mode.value !== 'app' || !wrongCode.value) return;
  digits.value = '';
  await nextTick();
  otp.value?.focus();
}

async function signInWithKey() {
  if (pending.value) return; // a code check is still running: its outcome decides the view
  mode.value = 'key';
  keyAttempted.value = true;
  // The browser's prompt takes focus; focusing the button first returns focus there when the prompt closes.
  await nextTick();
  keyButton.value?.$el.focus();
  await run(() =>
    refreshIfFactorGone(async () => {
      if ((await signInWithPasskey()) !== 'cancelled') await finish();
    }),
  );
}

function switchTo(next: SecondFactorMode) {
  mode.value = next;
  error.value = null;
}

/** The guard keeps a partial session on this page, so without this a viewer who lost every factor could not leave. */
const signOut = useLogout(() => router.push({ name: 'login' }));
</script>

<template>
  <AuthLayout
    :title="$t(card.titleKey)"
    :lead="$t(card.leadKey)"
    :lead-role="card.leadRole"
    centered
  >
    <template #header-end>
      <AppButton @click="signOut">
        <template #icon><LogOut aria-hidden="true" class="size-4" /></template>
        {{ $t('account.logout') }}
      </AppButton>
    </template>
    <template #badge>
      <InlineBit v-if="failed" kind="sweat" class="self-center" />
      <AuthBadge v-else :tone="card.tone"><component :is="card.icon" /></AuthBadge>
    </template>
    <form
      v-if="view === 'app' || view === 'backup'"
      ref="formElement"
      class="flex flex-col gap-4"
      @submit.prevent="submitCode"
    >
      <OtpInput
        v-if="view === 'app'"
        ref="otp"
        v-model="digits"
        :readonly="pending"
        :invalid="codeInvalid"
        :described-by="codeInvalid ? CODE_ERROR_ID : undefined"
        @complete="submitCode"
      />
      <AuthField
        v-else
        v-model="backupCode"
        name="code"
        :label="$t('auth.twoFactor.backupLabel')"
        autocomplete="off"
        placeholder="XXXX-XXXX-XXXX-XXXX"
        :error="fieldErrors.code"
        class="font-mono"
        required
        spellcheck="false"
        autocapitalize="characters"
      />
      <AuthError :id="CODE_ERROR_ID" :text="summary" />
      <AuthSubmit :pending="pending">{{ $t('auth.twoFactor.submit') }}</AuthSubmit>
      <AppButton v-if="view === 'app' && keyUsable" block @click="signInWithKey">
        <template #icon><Fingerprint aria-hidden="true" class="size-[18px]" /></template>
        {{ $t('auth.twoFactor.useKey') }}
      </AppButton>
    </form>
    <template v-else-if="view === 'key'">
      <!-- Always mounted: a live region inserted already holding its text is often not announced. -->
      <p role="status" class="flex items-center justify-center gap-2 text-sm text-muted">
        <template v-if="waitingForKey">
          <LoaderCircle aria-hidden="true" class="size-4 motion-safe:animate-spin" />{{
            $t('auth.twoFactor.keyWaiting')
          }}
        </template>
      </p>
      <AuthError :text="summary" />
      <AppButton ref="keyButton" block :disabled="pending" @click="signInWithKey">
        {{ keyAttempted ? $t('common.retry') : $t('auth.twoFactor.useKey') }}
      </AppButton>
    </template>
    <AppButton v-else-if="view === 'sessionChanged'" tone="primary" block @click="signOut">
      {{ $t('auth.twoFactor.signInAgain') }}
    </AppButton>
    <p v-if="hasCode" class="text-center text-sm">
      <button
        type="button"
        :class="AUTH_LINK"
        @click="switchTo(view === 'backup' ? 'app' : 'backup')"
      >
        {{ view === 'backup' ? $t('auth.twoFactor.useApp') : $t('auth.twoFactor.useBackup') }}
      </button>
    </p>
    <template #after>
      <p
        v-if="username"
        class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted"
      >
        <span
          >{{ $t('auth.twoFactor.signedInAs') }}
          <strong class="font-mono text-content">{{ username }}</strong></span
        >
        <span aria-hidden="true">·</span>
        <button type="button" :class="AUTH_LINK" @click="signOut">
          {{ $t('account.logout') }}
        </button>
      </p>
    </template>
  </AuthLayout>
</template>
