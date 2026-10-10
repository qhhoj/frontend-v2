<script setup lang="ts">
import { useRoute } from 'vue-router';
import InlineBit from '@/components/InlineBit.vue';
import type { BitKind } from '@/mascot/bit-frames';

/** The Bit that stands for the screen: asleep for an unbuilt page, a staff hard hat for the admin area. */
withDefaults(defineProps<{ bitKind?: 'asleep' | BitKind }>(), { bitKind: 'asleep' });
const route = useRoute();
</script>

<template>
  <section class="mx-auto max-w-3xl px-4 py-16 text-center">
    <InlineBit :kind="bitKind" class="mx-auto mb-3" />
    <h1 class="page-title">
      {{ $t(route.meta.titleKey ?? 'pages.notFound') }}
    </h1>
    <p class="mt-3 text-muted">{{ $t('placeholder.pending') }}</p>
  </section>
</template>
