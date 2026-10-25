<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { activate, resendActivation } from '@/api/auth.api';
import { ApiError } from '@/api/client';
import InlineBit from '@/components/InlineBit.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { useWaitingWhile } from '@/stores/use-waiting-while';
import type { BitKind } from '@/mascot/bit-frames';
import type { BitMood } from '@/mascot/bit-moods';
import { authErrorText } from './auth-errors';
import AuthError from './AuthError.vue';
import AuthLayout from './AuthLayout.vue';
import EmailLinkRequest from './EmailLinkRequest.vue';
import { useNoReferrer } from './use-no-referrer';

type ActivationState = 'pending' | 'activated' | 'linkDead' | 'linkResent' | 'failed';
/** After a successful activation the address is replaced by this word, so a reload shows the success card and sends nothing. */
const DONE_KEY = 'done';
/**
 * The Activation board's cards per state: title, explanation (with the role it is announced with) and the Bit beside
 * it. A card without a Bit is a working or failed state, not a finished one.
 */
const CARDS: Record<
  ActivationState,
  { titleKey: string; leadKey?: string; leadRole?: 'status' | 'alert'; bit?: BitMood | BitKind }
> = {
  pending: { titleKey: 'pages.activate', leadKey: 'auth.activating' },
  activated: {
    titleKey: 'auth.activation.doneTitle',
    leadKey: 'auth.activation.doneLead',
    leadRole: 'status',
    bit: 'crown',
  },
  linkDead: {
    titleKey: 'auth.activation.deadTitle',
    leadKey: 'auth.activation.deadLead',
    leadRole: 'alert',
    bit: 'sweat',
  },
  linkResent: { titleKey: 'auth.inbox.title', bit: 'envelope' },
  failed: { titleKey: 'pages.activate' },
};

// Set before the activation request below (onMounted), so that request already carries no Referer.
useNoReferrer();
const route = useRoute();
const router = useRouter();
const state = ref<ActivationState>(route.params.key === DONE_KEY ? 'activated' : 'pending');
const card = computed(() => CARDS[state.value]);
const errorText = ref<string | null>(null);
const asksForEmail = computed(() => state.value === 'linkDead' || state.value === 'linkResent');
// The page shows nothing until the key is checked, so it is waiting on first data: the shell announces it and walks the Bits.
useWaitingWhile(() => state.value === 'pending');

/** An expired or used key is not a failure to retry: the page offers a new link instead. */
/** A failure other than a dead link (a throttled or dropped request) keeps the key, so the viewer can try again. */
function showFailure(caught: unknown) {
  const linkDead = caught instanceof ApiError && caught.code === 'invalid_token';
  if (linkDead) {
    errorText.value = null;
    state.value = 'linkDead';
    return;
  }
  errorText.value = authErrorText(caught);
  state.value = 'failed';
}

async function activateKey() {
  try {
    await activate(String(route.params.key));
  } catch (caught) {
    showFailure(caught);
    return;
  }
  state.value = 'activated';
  // The used key does not stay in the address bar or the history (same page instance, no reload).
  await router.replace({ name: 'activate', params: { key: DONE_KEY } });
}

function retryActivation() {
  state.value = 'pending';
  void activateKey();
}

onMounted(() => {
  if (state.value === 'pending') void activateKey();
});
</script>

<template>
  <AuthLayout
    :title="$t(card.titleKey)"
    :lead="card.leadKey ? $t(card.leadKey) : undefined"
    :lead-role="card.leadRole"
    :centered="card.bit !== undefined"
  >
    <template v-if="card.bit" #badge>
      <InlineBit :kind="card.bit" class="self-center" />
    </template>
    <AppButton v-if="state === 'activated'" tone="primary" block :to="{ name: 'login' }">{{
      $t('auth.submitLogin')
    }}</AppButton>
    <EmailLinkRequest
      v-else-if="asksForEmail"
      :send="resendActivation"
      :submit-text="$t('auth.resend.send')"
      @sent="state = 'linkResent'"
    >
      <template #sent="{ email }">
        <p>{{ $t('auth.resend.sent', { email }) }}</p>
      </template>
    </EmailLinkRequest>
    <template v-else>
      <AuthError :text="errorText" />
      <AppButton v-if="state === 'failed'" block @click="retryActivation">
        {{ $t('common.retry') }}
      </AppButton>
    </template>
  </AuthLayout>
</template>
