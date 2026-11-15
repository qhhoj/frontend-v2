<script setup lang="ts">
import { reactive } from 'vue';
import StatusStepper from '@/components/ui/StatusStepper.vue';
import VerdictRing from '@/features/submissions/VerdictRing.vue';
import type { SubmitResult } from './use-submit-result';

/**
 * The strip under the submit bar (pane, sheet, full screen): a small ring with the verdict, the score and the failing test,
 * and a link to the full result. The failing test is muted after the score, and a narrow strip wraps it to a second
 * line instead of cutting it. Screen readers hear the final result once, not every test.
 */
/** `submissionId` is `null` while the request is on its way: the strip shows a "sending" state at once. */
const props = defineProps<{ result: SubmitResult; submissionId: string | null }>();
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
      :is-empty="submissionId === null || result.isEmpty"
    />
    <p
      aria-hidden="true"
      class="flex min-w-0 flex-1 flex-wrap gap-x-[2ch] font-mono text-sm tabular-nums"
    >
      <template v-if="submissionId === null">{{ $t('submit.submitting') }}</template>
      <StatusStepper v-else-if="!result.isFinished && !result.isEmpty" v-bind="result.step" />
      <template v-else>
        <span
          v-for="(part, index) in result.textParts"
          :key="index"
          :class="index > 0 && 'text-muted'"
          >{{ part }}</span
        >
      </template>
    </p>
    <p role="status" class="sr-only">{{ submissionId === null ? '' : result.announcement }}</p>
    <RouterLink
      v-if="submissionId !== null"
      :to="{ name: 'submission', params: { id: submissionId } }"
      data-testid="submit-result-link"
      class="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-accent-text underline"
      >{{ $t('submit.result.details') }}</RouterLink
    >
  </div>
</template>
