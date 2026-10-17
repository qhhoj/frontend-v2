<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next';
import type { SubmissionInContest } from './submission-contest';

/** Under the result in a contest (P-14 B): the next problem one click away; the ranking and clock are on the bar. */
defineProps<{ inContest: SubmissionInContest }>();
</script>

<template>
  <div data-testid="submission-next" class="flex flex-wrap items-center gap-x-3 gap-y-2">
    <RouterLink
      v-if="inContest.next"
      :to="{ name: 'problem', params: { code: inContest.next.code } }"
      class="inline-flex min-h-9 items-center gap-1 rounded-pill border border-line-strong bg-surface px-3.5 text-sm font-semibold hover:bg-surface-hover pointer-coarse:min-h-11"
    >
      {{
        $t('submission.contest.next', { label: inContest.next.label, name: inContest.next.name })
      }}
      <ChevronRight class="size-4" aria-hidden="true" />
    </RouterLink>
    <p class="text-meta text-muted">{{ $t('submission.contest.barNote') }}</p>
  </div>
</template>
