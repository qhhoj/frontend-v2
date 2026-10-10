<script setup lang="ts">
import { Code } from 'lucide-vue-next';

/** The code icon that opens the submission at its source. */
defineProps<{ id: string }>();
</script>

<template>
  <RouterLink
    :to="{ name: 'submission', params: { id }, hash: '#source' }"
    :aria-label="$t('submissions.viewSource')"
    :title="$t('submissions.viewSource')"
    class="inline-flex size-7 items-center justify-center rounded-pill text-muted hover:bg-surface-hover hover:text-content"
  >
    <Code class="size-4" aria-hidden="true" />
  </RouterLink>
</template>
