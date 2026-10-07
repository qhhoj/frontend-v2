<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const isNotFound = computed(() => route.name === 'not-found');
</script>

<template>
  <section class="mx-auto max-w-3xl px-4 py-16 text-center">
    <h1 class="font-display text-3xl font-semibold">
      {{ $t(route.meta.titleKey ?? 'pages.notFound') }}
    </h1>
    <p class="mt-3 text-muted">
      {{ $t(isNotFound ? 'placeholder.notFound' : 'placeholder.pending') }}
    </p>
    <RouterLink v-if="isNotFound" to="/" class="mt-6 inline-block text-accent-text underline">
      {{ $t('placeholder.backHome') }}
    </RouterLink>
  </section>
</template>
