<script setup lang="ts">
import { LogIn } from 'lucide-vue-next';
import type { RouteLocationRaw } from 'vue-router';

defineProps<{ to: RouteLocationRaw }>();
</script>

<template>
  <RouterLink
    :to="to"
    class="flex h-11 items-center justify-center gap-2 font-display font-semibold text-accent"
  >
    <LogIn class="size-5" aria-hidden="true" />
    {{ $t('submit.signIn') }}
  </RouterLink>
</template>
