<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next';
import type { ContestProblem } from '@/api/types/contests';

/** Under the result in the viewer's running contest (P-14 B): the next problem one click away. */
defineProps<{ next: ContestProblem }>();
</script>

<template>
  <RouterLink
    data-testid="submission-next"
    :to="{ name: 'problem', params: { code: next.code } }"
    class="inline-flex min-h-9 items-center gap-1 self-start rounded-pill border border-line-strong bg-surface px-3.5 text-sm font-semibold hover:bg-surface-hover pointer-coarse:min-h-11"
  >
    {{ $t('submission.contest.next', { label: next.label, name: next.name }) }}
    <ChevronRight class="size-4" aria-hidden="true" />
  </RouterLink>
</template>
