<script setup lang="ts">
import { UserRoundPlus } from 'lucide-vue-next';
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '@/api/client';
import { hasIssueCode } from '@/features/admin/ui/admin-errors';
import { translate } from '@/i18n';
import { usernameProblem } from '@/lib/username';
import { focusMain } from '@/router/focus-main';
import { useSessionStore } from '@/stores/session.store';
import AuthBadge from './AuthBadge.vue';
import AuthError from './AuthError.vue';
import AuthLayout from './AuthLayout.vue';
import AuthSubmit from './AuthSubmit.vue';
import NewPasswordField from './NewPasswordField.vue';
import SignupChoices from './SignupChoices.vue';
import UsernameField from './UsernameField.vue';
import { chosenIds } from './signup-choices';
import { useAfterSignIn } from './use-after-sign-in';
import { useAuthAction } from './use-auth-action';
import { useNoReferrer } from './use-no-referrer';
import { AUTH_LINK } from './auth-link';

/** Why the signup cannot finish from this page; `null` while the form can still succeed. */
type EndReason = 'token' | 'linked' | 'email';

const END_TEXT_KEYS = {
  token: 'errors.invalid_token',
  linked: 'auth.socialSignup.linked',
} as const;

// Set before the first request: the pickers start their queries during setup, before this page mounts.
useNoReferrer();

const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const afterSignIn = useAfterSignIn();
/**
 * The callback redirects here with the pending signup token (`/register/social?token=`). It is held in memory only:
 * on mount it leaves the address bar, so history and the Referer of later pages never carry it.
 */
const token = typeof route.query.token === 'string' ? route.query.token : '';
const form = reactive({
  username: '',
  password: '',
  organizationId: '',
  languageId: undefined as string | undefined,
});
const formElement = ref<HTMLFormElement | null>(null);
// The email and the language have no input: their issues (`email_taken`, a language gone meanwhile) land in the summary.
const { pending, error, fieldErrors, summary, run, dismiss, focusFirstInvalid } = useAuthAction(
  formElement,
  ['username', 'password', 'organizationId'],
);
watch(
  () => form.organizationId,
  () => dismiss('organizationId'),
);

const failedWith = (code: string) => error.value instanceof ApiError && error.value.code === code;
const emailTaken = () =>
  error.value instanceof ApiError &&
  error.value.issues.some(({ field, code }) => field === 'email' && code === 'email_taken');

/** A refused token and a linked identity are final (the token is spent); so is the provider's address, which this page cannot change. */
const endReason = computed<EndReason | null>(() => {
  if (!token || failedWith('invalid_token')) return 'token';
  if (failedWith('conflict') && !hasIssueCode(error.value, 'busy')) return 'linked';
  if (emailTaken()) return 'email';
  return null;
});
const endText = computed(() => {
  if (endReason.value === 'email') return summary.value;
  return endReason.value ? translate(END_TEXT_KEYS[endReason.value]) : null;
});

/** The form is gone once the signup ends, so focus moves to the page heading instead of falling to the body. */
watch(endReason, async (reason) => {
  if (!reason) return;
  await nextTick();
  focusMain();
});

function removeTokenFromAddress() {
  if (route.query.token === undefined) return;
  const query = { ...route.query };
  delete query.token;
  void router.replace({ query });
}

onMounted(removeTokenFromAddress);

async function submit() {
  if (usernameProblem(form.username)) {
    await nextTick();
    return focusFirstInvalid();
  }
  const { username, password } = form;
  await run(async () => {
    await session.completeSocialSignup({ token, username, password, ...chosenIds(form) });
    await afterSignIn();
  });
}
</script>

<template>
  <AuthLayout
    :title="$t('pages.socialSignup')"
    :lead="endReason ? undefined : $t('auth.socialSignup.lead')"
    width="wide"
  >
    <template #badge>
      <AuthBadge tone="accent"><UserRoundPlus /></AuthBadge>
    </template>
    <form
      v-if="!endReason"
      ref="formElement"
      class="flex flex-col gap-[18px]"
      @submit.prevent="submit"
    >
      <UsernameField
        v-model="form.username"
        :error="fieldErrors.username"
        @input="dismiss('username')"
      />
      <NewPasswordField
        v-model="form.password"
        :owner="{ username: form.username }"
        :error="fieldErrors.password"
        @input="dismiss('password')"
      />
      <SignupChoices
        v-model:organization-id="form.organizationId"
        v-model:language-id="form.languageId"
        :errors="fieldErrors"
      />
      <AuthError :text="summary" />
      <AuthSubmit :pending="pending">{{ $t('auth.submitRegister') }}</AuthSubmit>
    </form>
    <template v-else>
      <AuthError :text="endText" />
      <div class="flex flex-col items-center gap-2 text-center text-sm">
        <RouterLink :to="{ name: 'login' }" :class="AUTH_LINK">{{
          $t('auth.submitLogin')
        }}</RouterLink>
        <RouterLink :to="{ name: 'forgot-password' }" :class="AUTH_LINK">{{
          $t('auth.forgot')
        }}</RouterLink>
      </div>
    </template>
  </AuthLayout>
</template>
