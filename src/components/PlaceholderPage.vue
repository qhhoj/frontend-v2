<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <section class="mx-auto max-w-3xl px-4 py-16 text-center">
    <h1 class="font-display text-3xl font-semibold">
      {{ $t(route.meta.titleKey ?? 'pages.notFound') }}
    </h1>
    <p class="mt-3 text-muted">{{ $t('placeholder.pending') }}</p>
  </section>
</template>
