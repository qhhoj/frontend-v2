<script setup lang="ts">
import type { RankingProblem } from '@/api/types/contests';

/**
 * A problem column's header: the label links to the problem. A column without a code (the viewer may not open the
 * problem) is plain text, never a dead link.
 */
defineProps<{ problem: Pick<RankingProblem, 'code' | 'label'>; contestKey?: string }>();
</script>

<template>
  <RouterLink
    v-if="problem.code"
    :to="{ name: 'problem', params: { code: problem.code }, query: { contest: contestKey } }"
    :title="problem.code"
    class="inline-block min-w-6 cursor-pointer hover:text-accent-text hover:underline touch:-mx-2.5 touch:-my-3 touch:min-w-11 touch:px-2.5 touch:py-3"
    >{{ problem.label }}</RouterLink
  >
  <span v-else>{{ problem.label }}</span>
</template>
