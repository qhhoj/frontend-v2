<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue';
import { register, resendActivation } from '@/api/auth.api';
import { ApiError } from '@/api/client';
import InlineBit from '@/components/InlineBit.vue';
import { maskEmail } from '@/lib/mask-email';
import { usernameProblem } from '@/lib/username';
import { focusMain } from '@/router/focus-main';
import AuthError from './AuthError.vue';
import AuthField from './AuthField.vue';
import AuthLayout from './AuthLayout.vue';
import AuthSubmit from './AuthSubmit.vue';
import InboxNotice from './InboxNotice.vue';
import NewPasswordPair from './NewPasswordPair.vue';
import SignupChoices from './SignupChoices.vue';
import UsernameField from './UsernameField.vue';
import { chosenIds } from './signup-choices';
import { useAuthAction } from './use-auth-action';

/** RegisterA, then CheckEmail after a send, or Activation's "registration unavailable" card when the mailer is down. */
type Phase = 'form' | 'sent' | 'mailUnavailable';

/** `languageId` stays unset until the picker's C++17 default lands; `chosenIds` drops an empty school. */
const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmation: '',
  organizationId: '',
  languageId: undefined as string | undefined,
});
const phase = ref<Phase>('form');
/** A client-side gate: the backend stores no consent and the rules pages do not exist yet. */
const acceptedRules = ref(false);
const rulesMissing = ref(false);
const formElement = ref<HTMLFormElement | null>(null);
const { pending, fieldErrors, summary, run, dismiss, focusFirstInvalid, error } = useAuthAction(
  formElement,
  ['username', 'email', 'password', 'organizationId', 'languageId'],
);
// The pickers are components with models, not inputs that bubble `input`: editing one drops its old server message.
watch(
  () => form.organizationId,
  () => dismiss('organizationId'),
);
watch(
  () => form.languageId,
  () => dismiss('languageId'),
);
const LINK = 'font-semibold text-accent-text underline';

/** What the backend would refuse anyway, checked here so the viewer is told at once. */
const readyToSend = () =>
  acceptedRules.value &&
  usernameProblem(form.username) === null &&
  form.password === form.confirmation;

const mailerDown = () => error.value instanceof ApiError && error.value.code === 'mail_unavailable';

async function showPhase(next: Phase) {
  phase.value = next;
  await nextTick();
  focusMain(); // the form is gone; focus must not fall to the body
}

/** The name stays reserved for an unactivated account, so the form starts again with the name empty and focused. */
async function registerAgain() {
  form.username = '';
  phase.value = 'form';
  await nextTick();
  formElement.value?.querySelector<HTMLInputElement>('input[name="username"]')?.focus();
}

async function submit() {
  rulesMissing.value = !acceptedRules.value;
  if (!readyToSend()) {
    await nextTick();
    focusFirstInvalid();
    return;
  }
  const { username, email, password } = form;
  const registered = await run(() => register({ username, email, password, ...chosenIds(form) }));
  if (registered) return showPhase('sent');
  if (mailerDown()) return showPhase('mailUnavailable');
}
</script>

<template>
  <AuthLayout v-if="phase === 'sent'" :title="$t('auth.inbox.title')" centered>
    <template #badge>
      <InlineBit kind="envelope" class="self-center" />
    </template>
    <InboxNotice :resend="() => resendActivation(form.email)">
      <p>{{ $t('auth.registeredSentTo') }}</p>
      <p class="font-mono text-lg font-semibold text-content">{{ maskEmail(form.email) }}</p>
      <p>{{ $t('auth.registeredOpenMail') }}</p>
    </InboxNotice>
    <div class="flex flex-col gap-3 text-center text-sm text-muted">
      <p>{{ $t('auth.heldUsername', { username: form.username }) }}</p>
      <button type="button" :class="LINK" @click="registerAgain">
        {{ $t('auth.registerAgain') }}
      </button>
    </div>
  </AuthLayout>
  <AuthLayout
    v-else-if="phase === 'mailUnavailable'"
    :title="$t('auth.mailUnavailable.title')"
    :lead="$t('auth.mailUnavailable.lead')"
    lead-role="alert"
    centered
  >
    <template #badge>
      <InlineBit kind="sweat" class="self-center" />
    </template>
    <RouterLink
      :to="{ name: 'login' }"
      class="flex h-12 items-center justify-center rounded-pill border border-line-strong bg-surface-solid font-display font-semibold"
      >{{ $t('auth.toLogin') }}</RouterLink
    >
  </AuthLayout>
  <AuthLayout
    v-else
    :title="$t('auth.registerTitle')"
    :lead="$t('auth.registerLead')"
    width="double"
  >
    <template #header-end>
      <span class="hidden text-muted sm:inline"
        >{{ $t('auth.haveAccountPrompt') }}
        <RouterLink :to="{ name: 'login' }" :class="LINK">{{
          $t('auth.submitLogin')
        }}</RouterLink></span
      >
    </template>
    <form ref="formElement" class="flex flex-col gap-[18px]" @submit.prevent="submit">
      <div class="grid gap-4 sm:grid-cols-2">
        <UsernameField
          v-model="form.username"
          :error="fieldErrors.username"
          @input="dismiss('username')"
        />
        <AuthField
          v-model="form.email"
          type="email"
          name="email"
          :label="$t('auth.email')"
          autocomplete="email"
          inputmode="email"
          placeholder="ban@example.com"
          :error="fieldErrors.email"
          required
          spellcheck="false"
          @input="dismiss('email')"
        />
        <NewPasswordPair
          v-model:password="form.password"
          v-model:confirmation="form.confirmation"
          name="password"
          :label="$t('auth.password')"
          :owner="form"
          :error="fieldErrors.password"
          @input="dismiss('password')"
        />
        <SignupChoices
          v-model:organization-id="form.organizationId"
          v-model:language-id="form.languageId"
          :errors="fieldErrors"
        />
      </div>
      <div>
        <label class="flex min-h-11 cursor-pointer items-start gap-2.5 py-1 text-sm">
          <input
            v-model="acceptedRules"
            type="checkbox"
            name="rules"
            class="mt-0.5 size-5 shrink-0 accent-accent"
            :aria-invalid="rulesMissing ? 'true' : undefined"
            :aria-describedby="rulesMissing ? 'register-rules-error' : undefined"
            @change="rulesMissing = false"
          />
          {{ $t('auth.rules') }}
        </label>
        <p v-if="rulesMissing" id="register-rules-error" class="text-meta text-negative">
          {{ $t('auth.rulesRequired') }}
        </p>
      </div>
      <AuthError :text="summary" />
      <AuthSubmit :pending="pending">{{ $t('auth.submitRegister') }}</AuthSubmit>
      <p class="text-center text-sm text-muted">
        {{ $t('auth.haveAccountPrompt') }}
        <RouterLink :to="{ name: 'login' }" :class="LINK">{{ $t('auth.submitLogin') }}</RouterLink>
      </p>
    </form>
  </AuthLayout>
</template>
