<script setup lang="ts">
import type { CaseDetail } from './case-details';

/** The judge text of one test (feedback, extended feedback, output), shared by the result table and the result summary. */
defineProps<{ details: CaseDetail[] }>();
</script>

<template>
  <div v-for="detail in details" :key="detail.field" class="mt-1.5">
    <p class="text-meta text-muted">{{ detail.label }}</p>
    <pre
      class="mt-1 max-h-48 overflow-auto rounded-cell bg-surface-strong p-3 font-mono text-meta whitespace-pre-wrap [overflow-wrap:anywhere]"
      >{{ detail.text }}</pre>
  </div>
</template>
