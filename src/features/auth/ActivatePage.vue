<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { errorMessageKey } from '@/i18n/error-message';
import { activate } from '@/api/auth.api';

// Unstyled placeholder: logic only until the auth mock-ups are approved (plan 8b).
const route = useRoute();
const router = useRouter();
const error = ref<unknown>(null);
const state = ref<'pending' | 'activated' | 'failed'>('pending');

onMounted(async () => {
  try {
    await activate(String(route.params.key));
    state.value = 'activated';
  } catch (caught) {
    error.value = caught;
    state.value = 'failed';
    return;
  }
  // The used key does not stay in the address bar or the history (same page instance, no reload).
  await router.replace({ name: 'activate', params: { key: 'done' } });
});
</script>

<template>
  <section class="mx-auto max-w-md px-4 py-12">
    <h1 class="font-display text-3xl font-semibold">{{ $t('pages.activate') }}</h1>
    <p v-if="state === 'pending'" role="status" class="mt-6">{{ $t('auth.activating') }}</p>
    <template v-else-if="state === 'activated'">
      <p role="status" class="mt-6">{{ $t('auth.activated') }}</p>
      <RouterLink :to="{ name: 'login' }" class="mt-4 inline-block text-accent-text underline">{{
        $t('account.login')
      }}</RouterLink>
    </template>
    <p v-else role="alert" class="mt-6 text-negative">{{ $t(errorMessageKey(error)) }}</p>
  </section>
</template>
