<script setup lang="ts">
import type { RankingProblem } from '@/api/types/contests';

/**
 * A problem column's header: the label links to the problem. A column without a code (the viewer may not open the
 * problem) is plain text, never a dead link. With a name, the label sits over a one-line cut-short name.
 */
defineProps<{
  problem: Pick<RankingProblem, 'code' | 'label'>;
  /** The problem's name: shown cut short under the label, whole in the tooltip. */
  name?: string;
  contestKey?: string;
}>();
</script>

<template>
  <RouterLink
    v-if="problem.code"
    :to="{ name: 'problem', params: { code: problem.code }, query: { contest: contestKey } }"
    :title="name ? `${problem.code}: ${name}` : problem.code"
    class="inline-flex max-w-20 min-w-6 flex-col items-center cursor-pointer hover:text-accent-text hover:underline touch:-mx-2.5 touch:-my-3 touch:min-w-11 touch:px-2.5 touch:py-3"
    >
    <span>{{ problem.label }}</span>
    <span v-if="name" class="block max-w-full truncate text-tiny font-normal text-muted">{{
      name
    }}</span>
  </RouterLink>
  <span v-else>{{ problem.label }}</span>
</template>
