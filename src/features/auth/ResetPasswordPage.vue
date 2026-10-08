<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { confirmPasswordReset } from '@/api/auth.api';
import { ApiError } from '@/api/client';
import InlineBit from '@/components/InlineBit.vue';
import { focusMain } from '@/router/focus-main';
import { useSessionStore } from '@/stores/session.store';
import AuthError from './AuthError.vue';
import AuthLayout from './AuthLayout.vue';
import AuthSubmit from './AuthSubmit.vue';
import NewPasswordPair from './NewPasswordPair.vue';
import { useAuthAction } from './use-auth-action';
import { useNoReferrer } from './use-no-referrer';

/** After a dead-link answer the address is replaced by this word: the token leaves the address bar and history, and a reload shows the dead card. */
const DEAD_LINK_KEY = 'expired';

// Set before the reset request below, so that request already carries no Referer.
useNoReferrer();
const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const form = reactive({ newPassword: '', confirmation: '' });
const formElement = ref<HTMLFormElement | null>(null);
const { pending, error, fieldErrors, summary, run, dismiss, focusFirstInvalid } = useAuthAction(
  formElement,
  ['newPassword'],
);
/** An expired or used link cannot be retried: the page offers a new link instead of the form. */
const linkDead = computed(
  () =>
    route.params.token === DEAD_LINK_KEY ||
    (error.value instanceof ApiError && error.value.code === 'invalid_token'),
);
const passwordsMatch = computed(() => form.newPassword === form.confirmation);

async function resetPassword() {
  await confirmPasswordReset({ token: String(route.params.token), newPassword: form.newPassword });
  // The server ended every session of the account, this browser's included: learn that before the guards read a stale one.
  await session.refresh().catch(() => session.forgetSession());
  await router.replace({ name: 'login', query: { notice: 'password-reset' } });
}

/** The form is gone once the address changes; focus moves to the page, not to the body. */
async function showDeadLink() {
  await router.replace({ name: 'reset-password', params: { token: DEAD_LINK_KEY } });
  await nextTick();
  focusMain();
}

async function submit() {
  if (!passwordsMatch.value) {
    await nextTick();
    return focusFirstInvalid();
  }
  const resetDone = await run(resetPassword);
  if (!resetDone && linkDead.value) await showDeadLink();
}
</script>

<template>
  <AuthLayout
    :title="linkDead ? $t('auth.resetPassword.deadTitle') : $t('auth.resetPassword.title')"
    :lead="linkDead ? $t('auth.resetPassword.deadLead') : undefined"
    :lead-role="linkDead ? 'alert' : undefined"
    :centered="linkDead"
  >
    <template v-if="linkDead" #badge>
      <InlineBit kind="sweat" class="self-center" />
    </template>
    <RouterLink
      v-if="linkDead"
      :to="{ name: 'forgot-password' }"
      class="bg-gradient-accent flex h-12 items-center justify-center rounded-pill font-display font-semibold text-on-accent"
      >{{ $t('auth.resetPassword.requestNew') }}</RouterLink
    >
    <form v-else ref="formElement" class="flex flex-col gap-[18px]" @submit.prevent="submit">
      <NewPasswordPair
        v-model:password="form.newPassword"
        v-model:confirmation="form.confirmation"
        :error="fieldErrors.newPassword"
        @input="dismiss('newPassword')"
      />
      <AuthError :text="summary" />
      <AuthSubmit :pending="pending">{{ $t('auth.resetPassword.submit') }}</AuthSubmit>
    </form>
  </AuthLayout>
</template>
