<script setup lang="ts">
import type { RankingProblem } from '@/api/types/contests';

/**
 * A problem column's header: the label links to the problem. A column without a code (the viewer may not open the
 * problem) is plain text, never a dead link.
 */
defineProps<{ problem: Pick<RankingProblem, 'code' | 'label'> }>();
</script>

<template>
  <RouterLink
    v-if="problem.code"
    :to="{ name: 'problem', params: { code: problem.code } }"
    :title="problem.code"
    class="inline-block min-w-6 cursor-pointer hover:text-accent-text hover:underline"
    >{{ problem.label }}</RouterLink
  >
  <span v-else>{{ problem.label }}</span>
</template>
