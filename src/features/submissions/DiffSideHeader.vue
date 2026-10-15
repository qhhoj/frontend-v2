<script setup lang="ts">
import type { SubmissionDetail } from '@/api/types/submissions';
import UserLink from '@/components/UserLink.vue';
import VerdictBadge from '@/components/VerdictBadge.vue';
import { submissionVerdictOf } from '@/lib/verdicts';
import { submissionShortId } from './submission-short-id';

/** One side's card above the diff (board M6C: side, short id, verdict, author, problem and language). The detail may be missing (forbidden). */
defineProps<{ label: string; id: string; detail: SubmissionDetail | undefined }>();
</script>

<template>
  <div
    data-testid="diff-side-header"
    class="flex min-w-0 flex-col gap-1 rounded-row border border-line bg-surface-strong px-4 py-3"
  >
    <p class="flex flex-wrap items-center gap-2">
      <span class="text-xs font-semibold tracking-wider text-muted uppercase">{{ label }}</span>
      <RouterLink
        :to="{ name: 'submission', params: { id } }"
        class="font-mono font-semibold text-content hover:underline"
        >{{ submissionShortId(id) }}</RouterLink
      >
      <VerdictBadge v-if="detail" :verdict="submissionVerdictOf(detail)" size="sm" />
      <UserLink v-if="detail?.user" :username="detail.user.username" :rating="detail.user.rating" />
    </p>
    <p v-if="detail" class="truncate text-sm text-muted">
      {{ detail.problem?.name ?? '—' }} · {{ detail.language?.name ?? '—' }}
    </p>
  </div>
</template>
