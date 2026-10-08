<script setup lang="ts">
import { UserRoundPlus } from 'lucide-vue-next';
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '@/api/client';
import { translate } from '@/i18n';
import { usernameProblem } from '@/lib/username';
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

const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const afterSignIn = useAfterSignIn();
/**
 * The callback redirects here with the pending signup token (`/register/social?token=`). The token is held in memory
 * only: on mount it leaves the address bar, so history and the Referer of later pages never carry it.
 */
const token = ref(typeof route.query.token === 'string' ? route.query.token : '');
const form = reactive({
  username: '',
  password: '',
  organizationId: '',
  languageId: undefined as string | undefined,
});
const formElement = ref<HTMLFormElement | null>(null);
// The email has no input: an `email_taken` issue (the provider's address is already registered) lands in the summary.
const { pending, error, fieldErrors, summary, run, dismiss, focusFirstInvalid } = useAuthAction(
  formElement,
  ['username', 'password', 'organizationId', 'languageId'],
);
watch(
  () => form.organizationId,
  () => dismiss('organizationId'),
);
watch(
  () => form.languageId,
  () => dismiss('languageId'),
);
const tokenRejected = computed(
  () => error.value instanceof ApiError && error.value.code === 'invalid_token',
);
const tokenUsable = computed(() => token.value !== '' && !tokenRejected.value);
/** Without a usable token there is nothing to submit, so the backend's own message stands alone. */
const errorText = computed(() => (token.value ? summary.value : translate('errors.invalid_token')));

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
    await session.completeSocialSignup({
      token: token.value,
      username,
      password,
      ...chosenIds(form),
    });
    await afterSignIn();
  });
}
</script>

<template>
  <AuthLayout
    :title="$t('pages.socialSignup')"
    :lead="tokenUsable ? $t('auth.socialSignup.lead') : undefined"
    width="wide"
  >
    <template #badge>
      <AuthBadge tone="accent"><UserRoundPlus /></AuthBadge>
    </template>
    <form
      v-if="tokenUsable"
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
      <AuthError :text="errorText" />
      <AuthSubmit :pending="pending">{{ $t('auth.submitRegister') }}</AuthSubmit>
    </form>
    <template v-else>
      <AuthError :text="errorText" />
      <RouterLink
        :to="{ name: 'login' }"
        class="text-center text-sm font-semibold text-accent-text underline"
        >{{ $t('auth.backToLogin') }}</RouterLink
      >
    </template>
  </AuthLayout>
</template>
