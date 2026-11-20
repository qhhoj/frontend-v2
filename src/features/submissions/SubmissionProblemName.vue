<script setup lang="ts">
import { computed } from 'vue';
import type { SubmissionListItem } from '@/api/types/submissions';
import { NO_VALUE } from '@/lib/format';
import { titleParts } from '@/lib/title-parts';
import DeletedProblemChip from './DeletedProblemChip.vue';

/**
 * The problem of a row on one line: contest letter, the name's shared series dimmed and its own part strong (a link
 * unless deleted), and with `showCode` the code after it in muted mono (otherwise on hover only). When the line is too
 * long the code gives way first, then the series, and the name's own part last. `short` (a phone row) leaves the series
 * out and is plain text: there the whole row is one target, the submission.
 */
const props = defineProps<{
  problem: SubmissionListItem['problem'];
  label?: string;
  showCode?: boolean;
  short?: boolean;
}>();
const parts = computed(() => titleParts(props.problem?.name ?? ''));
</script>

<template>
  <div v-if="problem" class="flex min-w-0 items-baseline whitespace-nowrap" :title="problem.code">
    <span v-if="label" class="mr-2 shrink-0 font-display font-bold">{{ label }}</span>
    <span v-if="parts.series && !short" class="min-w-0 shrink-100 truncate text-muted">{{
      parts.series
    }}</span>
    <span v-if="parts.series && !short" aria-hidden="true" class="shrink-0 px-1 text-muted">·</span>
    <span
      v-if="problem.isDeleted || short"
      class="max-w-full shrink-0 truncate font-semibold text-content"
      >{{ parts.name }} <DeletedProblemChip v-if="problem.isDeleted"
    /></span>
    <RouterLink
      v-else
      :to="{ name: 'problem', params: { code: problem.code } }"
      :aria-label="problem.name"
      class="max-w-full shrink-0 truncate font-semibold text-content hover:underline"
      >{{ parts.name }}</RouterLink
    >
    <!-- Only a wide card has room for the code; a narrower one keeps it for the name. -->
    <span
      v-if="showCode"
      class="ml-2 hidden min-w-0 shrink-1000 truncate font-mono text-small text-muted @5xl:inline"
      >{{ problem.code }}</span
    >
  </div>
  <template v-else>{{ NO_VALUE }}</template>
</template>
