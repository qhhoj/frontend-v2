<script setup lang="ts">
import { computed, useId } from 'vue';
import type { Schemas } from '@/api/schemas';
import { localEditsRowsOf } from './import-outcome';

/**
 * "Thiết lập chấm": what a sync did with the limits, partial scoring, checker and grader — kept as edited on QHHOJ,
 * or taken from the package. Nothing is drawn when the package left them all as they were. `isLastSync` titles it as the
 * sync that just ended, where it sits beside the current settings (the link panel).
 */
const props = defineProps<{ localEdits: Schemas['LocalEditsResponse']; isLastSync?: boolean }>();
const rows = computed(() => localEditsRowsOf(props.localEdits));
const titleId = useId();
</script>

<template>
  <section
    v-if="rows.length"
    class="flex flex-col gap-1"
    :aria-labelledby="titleId"
    data-testid="local-edits"
  >
    <h3 :id="titleId" class="font-display font-semibold">
      {{ $t(`admin.polygonLink.progress.localEdits.${isLastSync ? 'lastSyncTitle' : 'title'}`) }}
    </h3>
    <dl class="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 text-sm">
      <template v-for="row in rows" :key="row.kind">
        <dt class="text-muted">{{ $t(`admin.polygonLink.progress.localEdits.${row.kind}`) }}</dt>
        <dd class="break-words" :data-local-edits="row.kind">{{ row.names }}</dd>
      </template>
    </dl>
  </section>
</template>
