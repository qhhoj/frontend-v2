<script setup lang="ts">
import type { SubmissionListItem } from '@/api/types/submissions';
import DeletedProblemChip from './DeletedProblemChip.vue';
import { NO_VALUE } from './submission-row';

/** The problem of a row as one truncating line: contest letter, name (a link unless deleted), and with `showCode` the code after it in muted mono (otherwise on hover only). */
defineProps<{ problem: SubmissionListItem['problem']; label?: string; showCode?: boolean }>();
</script>

<template>
  <div v-if="problem" class="truncate" :title="problem.code">
    <span v-if="label" class="mr-1.5 font-display font-bold">{{ label }}</span>
    <span v-if="problem.isDeleted" class="font-semibold text-content"
      >{{ problem.name }} <DeletedProblemChip
    /></span>
    <RouterLink
      v-else
      :to="{ name: 'problem', params: { code: problem.code } }"
      class="font-semibold text-content hover:underline"
      >{{ problem.name }}</RouterLink
    >
    <span v-if="showCode" class="ml-2 font-mono text-xs text-muted">{{ problem.code }}</span>
  </div>
  <template v-else>{{ NO_VALUE }}</template>
</template>
