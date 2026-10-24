<script setup lang="ts">
import { reactive } from 'vue';
import VerdictRing from '@/features/submissions/VerdictRing.vue';
import type { SubmitResult } from './use-submit-result';

/**
 * The strip on top of the submit form (dock, sheet, full screen): a small ring with the verdict, the score and the failing test, and a link to
 * the full result. Screen readers hear the final result once, not every test.
 */
const props = defineProps<{ result: SubmitResult; submissionId: string }>();
const result = reactive(props.result);
</script>

<template>
  <div
    data-testid="submit-result"
    class="flex min-h-11 items-center gap-3 rounded-row bg-surface-strong px-3 py-1.5"
  >
    <VerdictRing
      size="sm"
      :progress="result.progress"
      :verdict="result.verdict"
      :share="result.partialShare"
      :is-empty="result.isEmpty"
    />
    <p aria-hidden="true" class="min-w-0 flex-1 truncate font-mono text-sm tabular-nums">
      {{ result.text }}
    </p>
    <p role="status" class="sr-only">{{ result.announcement }}</p>
    <RouterLink
      :to="{ name: 'submission', params: { id: submissionId } }"
      data-testid="submit-result-link"
      class="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-accent-text underline"
      >{{ $t('submit.result.details') }}</RouterLink
    >
  </div>
</template>
