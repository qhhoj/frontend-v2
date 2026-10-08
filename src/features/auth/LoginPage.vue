<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '@/api/client';
import { translate } from '@/i18n';
import { errorMessageKey } from '@/i18n/error-message';
import { safeRedirect } from '@/router/safe-redirect';
import { useSessionStore } from '@/stores/session.store';

// Unstyled placeholder: logic only until the login mock-up is approved (plan 8b).
const session = useSessionStore();
const route = useRoute();
const router = useRouter();
const username = ref('');
const password = ref('');
const pending = ref(false);
const error = ref<unknown>(null);
/** A ban carries the moderator's reason in the backend message (English); everything else is translated by code. */
const errorText = computed(() =>
  error.value instanceof ApiError &&
  error.value.code === 'banned' &&
  error.value.message.includes('Reason:')
    ? error.value.message
    : translate(errorMessageKey(error.value)),
);

async function submit() {
  pending.value = true;
  error.value = null;
  try {
    await session.login({ username: username.value, password: password.value });
    const redirect = safeRedirect(route.query.redirect);
    await router.push(
      session.status === 'partial' ? { name: 'login-2fa', query: { redirect } } : redirect,
    );
  } catch (caught) {
    error.value = caught;
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <section class="mx-auto max-w-md px-4 py-12">
    <h1 class="font-display text-3xl font-semibold">{{ $t('pages.login') }}</h1>
    <p class="mt-2 text-muted">{{ $t('placeholder.pending') }}</p>
    <form class="mt-6 flex flex-col gap-4" @submit.prevent="submit">
      <label class="flex flex-col gap-1">
        {{ $t('auth.username') }}
        <input
          v-model="username"
          name="username"
          autocomplete="username"
          required
          class="min-h-11 rounded-row border border-line bg-surface-strong px-3"
        />
      </label>
      <label class="flex flex-col gap-1">
        {{ $t('auth.password') }}
        <input
          v-model="password"
          name="password"
          type="password"
          autocomplete="current-password"
          required
          class="min-h-11 rounded-row border border-line bg-surface-strong px-3"
        />
      </label>
      <p v-if="error" role="alert" class="text-negative">{{ errorText }}</p>
      <button
        type="submit"
        :disabled="pending"
        class="min-h-11 rounded-pill border border-line font-semibold"
      >
        {{ $t('auth.submitLogin') }}
      </button>
    </form>
    <p class="mt-4 flex flex-wrap gap-4 text-sm">
      <RouterLink :to="{ name: 'register' }" class="text-accent-text underline">{{
        $t('auth.noAccount')
      }}</RouterLink>
      <RouterLink :to="{ name: 'forgot-password' }" class="text-accent-text underline">{{
        $t('auth.forgot')
      }}</RouterLink>
    </p>
  </section>
</template>
