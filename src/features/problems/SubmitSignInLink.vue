<script setup lang="ts">
import { LogIn } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { safeRedirect } from '@/router/safe-redirect';

/** Sign in, then come back to the page the viewer is on. */
const route = useRoute();
const signInTarget = computed(() => ({
  path: '/login',
  query: { redirect: safeRedirect(route.fullPath) },
}));
</script>

<template>
  <RouterLink
    :to="signInTarget"
    class="flex h-11 items-center justify-center gap-2 font-display font-semibold text-accent"
  >
    <LogIn class="size-5" aria-hidden="true" />
    {{ $t('submit.signIn') }}
  </RouterLink>
</template>
