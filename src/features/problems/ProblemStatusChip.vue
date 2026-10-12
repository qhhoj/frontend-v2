<script setup lang="ts">
import { Check, CircleAlert } from 'lucide-vue-next';
import type { ViewerStatus } from '@/api/types/problems';

defineProps<{ status: ViewerStatus }>();
</script>

<template>
  <span
    v-if="status === 'solved'"
    class="inline-flex items-center gap-1.5 rounded-pill bg-verdict-ac-bg px-3 py-1.5 text-meta font-semibold text-verdict-ac"
  >
    <Check class="size-4" aria-hidden="true" />{{ $t('problems.solved') }}
  </span>
  <span
    v-else-if="status === 'attempted'"
    class="inline-flex items-center gap-1.5 rounded-pill bg-verdict-tle-bg px-3 py-1.5 text-meta font-semibold text-verdict-tle"
  >
    <CircleAlert class="size-4" aria-hidden="true" />{{ $t('problems.attempted') }}
  </span>
</template>
