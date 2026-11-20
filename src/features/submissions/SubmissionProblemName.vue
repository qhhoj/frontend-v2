<script setup lang="ts">
import { computed } from 'vue';
import type { SubmissionListItem } from '@/api/types/submissions';
import { NO_VALUE } from '@/lib/format';
import { titleParts } from '@/lib/title-parts';
import DeletedProblemChip from './DeletedProblemChip.vue';

/**
 * The problem of a row on one line: contest letter, the name's shared series dimmed and its own part strong (a link to
 * the problem unless deleted), and with `showCode` the code after it in muted mono (otherwise on hover only). The code
 * is shown whole or not at all: when it does not fit after the name it wraps to a second line, which the one-line box
 * hides. Then the series is cut, and the name's own part last. `short` (a phone row) leaves the series out. A deleted
 * problem shows its tag instead of the code (the tag is taller than a text line, so that row is not a one-line box).
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
  <div
    v-if="problem"
    class="flex min-w-0 items-baseline whitespace-nowrap"
    :class="{ 'h-lh flex-wrap overflow-hidden': !problem.isDeleted }"
    :title="problem.code"
  >
    <span class="flex max-w-full min-w-0 items-baseline">
      <span v-if="label" class="mr-2 shrink-0 font-display font-bold">{{ label }}</span>
      <span v-if="parts.series && !short" class="min-w-0 shrink-100 truncate text-muted">{{
        parts.series
      }}</span>
      <span v-if="parts.series && !short" aria-hidden="true" class="shrink-0 px-1 text-muted"
        >·</span
      >
      <span v-if="problem.isDeleted" class="max-w-full shrink-0 truncate font-semibold text-content"
        >{{ parts.name }} <DeletedProblemChip
      /></span>
      <RouterLink
        v-else
        :to="{ name: 'problem', params: { code: problem.code } }"
        :aria-label="problem.name"
        class="max-w-full shrink-0 truncate font-semibold text-content hover:underline"
        >{{ parts.name }}</RouterLink
      >
    </span>
    <!-- Only a wide card has room for the code; it never shrinks: a code that does not fit wraps out of sight. -->
    <span
      v-if="showCode && !problem.isDeleted"
      data-testid="problem-code"
      class="ml-2 hidden shrink-0 font-mono text-small text-muted @5xl:inline"
      >{{ problem.code }}</span
    >
  </div>
  <template v-else>{{ NO_VALUE }}</template>
</template>
