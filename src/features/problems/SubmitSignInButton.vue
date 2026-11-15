<script setup lang="ts">
import { LogIn } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppButton from '@/components/ui/AppButton.vue';
import { safeRedirect } from '@/router/safe-redirect';

/** The signed-out viewer's version of the header's "Nộp bài": sign in, then return to this problem. */
const route = useRoute();
const signInTarget = computed(() => ({
  path: '/login',
  query: { redirect: safeRedirect(route.fullPath) },
}));
</script>

<template>
  <AppButton tone="primary" :to="signInTarget" class="shrink-0">
    <LogIn class="size-5" aria-hidden="true" />{{ $t('submit.signIn') }}
  </AppButton>
</template>
