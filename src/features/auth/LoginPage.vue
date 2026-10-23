<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import { translate } from '@/i18n';
import { useSessionStore } from '@/stores/session.store';
import { queryErrorText } from './auth-errors';
import AuthError from './AuthError.vue';
import AuthField from './AuthField.vue';
import AuthNotice from './AuthNotice.vue';
import AuthSubmit from './AuthSubmit.vue';
import AuthLayout from './AuthLayout.vue';
import SocialButtons from './SocialButtons.vue';
import { useAfterSignIn, usePreloadAfterSignIn } from './use-after-sign-in';
import { useAuthAction } from './use-auth-action';
import { AUTH_LINK } from './auth-link';

const session = useSessionStore();
const route = useRoute();
const afterSignIn = useAfterSignIn();
const preloadAfterSignIn = usePreloadAfterSignIn();
const form = reactive({ username: '', password: '' });
const formElement = ref<HTMLFormElement | null>(null);
const {
  pending,
  error,
  fieldErrors: serverFieldErrors,
  summary,
  dismiss,
  run,
  focusFirstInvalid,
} = useAuthAction(formElement, ['username', 'password']);
/** Empty fields are caught here, in Vietnamese, instead of by the browser's own (English) validation bubble. */
const missing = ref<Record<string, string>>({});
const fieldErrors = computed(() => ({ ...serverFieldErrors.value, ...missing.value }));
const clearMissing = (name: string) => {
  delete missing.value[name];
  dismiss(name);
};
const findMissing = () => ({
  ...(form.username.trim() ? {} : { username: translate('auth.usernameRequired') }),
  ...(form.password ? {} : { password: translate('auth.passwordRequired') }),
});

/** Messages other pages hand over through `?notice=`; any other value is ignored. */
const NOTICES = new Map([['password-reset', 'auth.notice.passwordReset']]);
const noticeDismissed = ref(false);
const notice = computed(() => {
  const key = typeof route.query.notice === 'string' ? NOTICES.get(route.query.notice) : undefined;
  return key && !noticeDismissed.value ? translate(key) : null;
});
/** Once an attempt has failed, its own message replaces the social-callback error that brought the viewer here. */
const errorText = computed(() => (error.value ? summary.value : queryErrorText(route.query.error)));
/** A pending account, from this attempt or from the OAuth callback, can ask for its activation mail again (B16). */
const notActivated = computed(() =>
  error.value
    ? error.value instanceof ApiError && error.value.code === 'account_not_activated'
    : route.query.error === 'account_not_activated',
);

const submit = async () => {
  missing.value = findMissing();
  if (Object.keys(missing.value).length) {
    await nextTick();
    return focusFirstInvalid();
  }
  await attempt();
};
const attempt = () =>
  run(async () => {
    preloadAfterSignIn();
    await session.login({ ...form });
    await afterSignIn();
  });
</script>

<template>
  <AuthLayout :title="$t('pages.login')" brand>
    <template #header-end>
      <span class="flex items-center gap-1"
        ><span class="text-muted max-sm:hidden">{{ $t('auth.noAccountPrompt') }}</span>
        <RouterLink :to="{ name: 'register' }" :class="AUTH_LINK">{{
          $t('account.register')
        }}</RouterLink></span
      >
    </template>
    <form
      ref="formElement"
      method="post"
      novalidate
      class="flex flex-col gap-4"
      @submit.prevent="submit"
    >
      <AuthNotice v-if="notice" dismissible @dismiss="noticeDismissed = true">{{
        notice
      }}</AuthNotice>
      <AuthError :text="errorText">
        <RouterLink v-if="notActivated" :to="{ name: 'activate-resend' }" :class="AUTH_LINK">{{
          $t('auth.resendLink')
        }}</RouterLink>
      </AuthError>
      <AuthField
        v-model="form.username"
        name="username"
        :label="$t('auth.username')"
        autocomplete="username"
        :error="fieldErrors.username"
        placeholder="bitcoder"
        required
        spellcheck="false"
        autocapitalize="none"
        @input="clearMissing('username')"
      />
      <AuthField
        v-model="form.password"
        type="password"
        name="password"
        :label="$t('auth.password')"
        autocomplete="current-password"
        :error="fieldErrors.password"
        placeholder="••••••••"
        required
        @input="clearMissing('password')"
      />
      <p class="flex justify-end text-sm">
        <RouterLink :to="{ name: 'forgot-password' }" :class="AUTH_LINK">{{
          $t('auth.forgot')
        }}</RouterLink>
      </p>
      <AuthSubmit :pending="pending">{{ $t('auth.submitLogin') }}</AuthSubmit>
      <SocialButtons />
      <p class="text-center text-sm text-muted">
        {{ $t('auth.noAccountPrompt') }}
        <RouterLink :to="{ name: 'register' }" :class="AUTH_LINK">{{
          $t('account.register')
        }}</RouterLink>
      </p>
    </form>
  </AuthLayout>
</template>
