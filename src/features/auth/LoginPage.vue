<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import { translate } from '@/i18n';
import { useSessionStore } from '@/stores/session.store';
import { queryErrorText } from './auth-errors';
import AuthError from './AuthError.vue';
import AuthField from './AuthField.vue';
import AuthNotice from './AuthNotice.vue';
import AuthSubmit from './AuthSubmit.vue';
import LoginBrandPanel from './LoginBrandPanel.vue';
import SocialButtons from './SocialButtons.vue';
import { useAfterSignIn, usePreloadAfterSignIn } from './use-after-sign-in';
import { useAuthAction } from './use-auth-action';

const session = useSessionStore();
const route = useRoute();
const afterSignIn = useAfterSignIn();
const preloadAfterSignIn = usePreloadAfterSignIn();
const form = reactive({ username: '', password: '' });
const formElement = ref<HTMLFormElement | null>(null);
const { pending, error, fieldErrors, summary, dismiss, run } = useAuthAction(formElement, [
  'username',
  'password',
]);

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
const LINK = 'font-semibold text-accent-text underline';

const submit = () =>
  run(async () => {
    preloadAfterSignIn();
    await session.login({ ...form });
    await afterSignIn();
  });
</script>

<template>
  <div
    class="relative grid min-h-[calc(100dvh-env(safe-area-inset-top))] grid-cols-1 content-start pb-[env(safe-area-inset-bottom)] lg:grid-cols-[minmax(0,7fr)_minmax(0,9fr)] lg:content-stretch"
  >
    <LoginBrandPanel />
    <section class="flex items-center justify-center lg:p-8">
      <form
        ref="formElement"
        method="post"
        class="flex w-full max-w-[440px] flex-col gap-4 px-6 py-6 lg:glass lg:gap-[18px] lg:rounded-panel lg:p-8"
        @submit.prevent="submit"
      >
        <h1 class="font-display text-[26px] leading-tight font-bold">{{ $t('pages.login') }}</h1>
        <AuthNotice v-if="notice" dismissible @dismiss="noticeDismissed = true">{{
          notice
        }}</AuthNotice>
        <AuthError :text="errorText">
          <RouterLink v-if="notActivated" :to="{ name: 'activate-resend' }" :class="LINK">{{
            $t('auth.resendLink')
          }}</RouterLink>
        </AuthError>
        <AuthField
          v-model="form.username"
          name="username"
          :label="$t('auth.username')"
          autocomplete="username"
          :error="fieldErrors.username"
          placeholder="minhthu"
          required
          spellcheck="false"
          autocapitalize="none"
          @input="dismiss('username')"
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
          @input="dismiss('password')"
        />
        <p class="-mt-1 flex justify-end text-sm">
          <RouterLink :to="{ name: 'forgot-password' }" class="text-accent-text underline">{{
            $t('auth.forgot')
          }}</RouterLink>
        </p>
        <AuthSubmit :pending="pending">{{ $t('auth.submitLogin') }}</AuthSubmit>
        <SocialButtons />
        <p class="text-center text-sm text-muted">
          {{ $t('auth.noAccountPrompt') }}
          <RouterLink :to="{ name: 'register' }" :class="LINK">{{
            $t('account.register')
          }}</RouterLink>
        </p>
      </form>
    </section>
  </div>
</template>
