<script setup lang="ts">
import { computed, toRef } from 'vue';
import CopyButton from '@/components/CopyButton.vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import { translate } from '@/i18n';
import { forbiddenReasonKey, isForbidden } from './forbidden-reason';
import SourceViewSkeleton from './SourceViewSkeleton.vue';
import { useSubmissionSourceQuery } from './submissions.queries';

/** Keep `SourceViewSkeleton.vue` in step: same card, header and line classes. */
const props = defineProps<{ id: string; problemCode: string | null; isOwn: boolean }>();
const { data, isPending, error, refetch } = useSubmissionSourceQuery(toRef(props, 'id'));

/** A 403 is a reason to show, not an error to retry: the B18 reason, else the plain "hidden" text. */
const forbiddenText = computed(() => {
  const key =
    forbiddenReasonKey(error.value) ??
    (isForbidden(error.value) ? 'submission.sourceHidden' : null);
  return key === null ? null : translate(key);
});
/** A source ending in a newline has no empty last line to number. */
const TRAILING_NEWLINE = /\n$/;
const source = computed(() => data.value?.source ?? '');
/** One text node for the whole gutter, so a 65 536-line source adds one element, not thousands. */
const lineNumbers = computed(() =>
  Array.from(
    { length: source.value.replace(TRAILING_NEWLINE, '').split('\n').length },
    (_unused, index) => index + 1,
  ).join('\n'),
);
</script>

<template>
  <GlassCard as="div" class="overflow-hidden rounded-panel">
    <div class="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-3 sm:px-8">
      <h2 class="font-display text-lg font-semibold">{{ $t('submission.source.title') }}</h2>
      <div class="flex flex-wrap items-center gap-2">
        <CopyButton v-if="data" :text="source" :label="$t('submission.source.copy')" />
        <RouterLink
          v-if="isOwn && problemCode && !forbiddenText"
          :to="{ name: 'problem', params: { code: problemCode }, query: { resubmit: id } }"
          class="inline-flex min-h-11 items-center rounded-pill bg-accent-soft px-4 text-sm font-semibold text-accent-soft-text"
          >{{ $t('submission.source.resubmit') }}</RouterLink
        >
      </div>
    </div>
    <p v-if="forbiddenText" class="px-6 pb-6 text-muted sm:px-8">{{ forbiddenText }}</p>
    <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><SourceViewSkeleton /></template>
      <div
        tabindex="0"
        role="region"
        :aria-label="$t('submission.source.title')"
        class="flex overflow-x-auto bg-surface-strong py-4 font-mono text-[13px] leading-relaxed focus-visible:-outline-offset-2"
      >
        <pre aria-hidden="true" class="shrink-0 px-4 text-right text-muted select-none">{{
          lineNumbers
        }}</pre>
        <pre class="pr-6">{{ source }}</pre>
      </div>
    </QueryState>
  </GlassCard>
</template>
