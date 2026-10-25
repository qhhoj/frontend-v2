<script setup lang="ts">
import type { SubmissionListItem } from '@/api/types/submissions';
import DeletedProblemChip from './DeletedProblemChip.vue';
import { NO_VALUE } from '@/lib/format';

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
    <!-- Only a wide card has room for the code; a narrower one keeps it for the name. -->
    <span
      v-if="showCode"
      class="ml-2 hidden font-mono text-caption leading-4 text-muted @5xl:inline"
      >{{ problem.code }}</span
    >
  </div>
  <template v-else>{{ NO_VALUE }}</template>
</template>
