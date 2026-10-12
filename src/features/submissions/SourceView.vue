<script setup lang="ts">
import { computed, onMounted, ref, toRef, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import InlineBit from '@/components/InlineBit.vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import { aceForSubmissionKey } from '@/components/code-language-keys';
import { showCode } from '@/components/code-highlight';
import { translate } from '@/i18n';
import { sourceLineCount } from '@/lib/source';
import { forbiddenReasonKey, isForbidden } from './forbidden-reason';
import SourceFileBar from './SourceFileBar.vue';
import SourceViewSkeleton from './SourceViewSkeleton.vue';
import { useSubmissionSourceQuery } from './submissions.queries';

/** Keep `SourceViewSkeleton.vue` in step: same card, header and line classes. */
const props = defineProps<{
  id: string;
  problemCode: string | null;
  isOwn: boolean;
  languageKey: string | null;
  languageName: string | null;
}>();
const route = useRoute();
/** "View source" in a submission list links here: the page loads before this card exists, so the hash is applied on mount. */
onMounted(() => {
  if (route.hash === '#source') document.getElementById('source')?.scrollIntoView();
});
const { data, isPending, error, refetch } = useSubmissionSourceQuery(toRef(props, 'id'));

/** A 403 is a reason to show, not an error to retry: the B18 reason, else the plain "hidden" text. */
const forbiddenText = computed(() => {
  const key =
    forbiddenReasonKey(error.value) ??
    (isForbidden(error.value) ? 'submission.sourceHidden' : null);
  return key === null ? null : translate(key);
});
const source = computed(() => data.value?.source ?? '');
/** Plain text first, coloured once the language's parser has loaded; the text itself never changes. */
const sourceBlock = ref<HTMLElement | null>(null);
watchEffect(() => {
  const ace = props.languageKey === null ? null : aceForSubmissionKey(props.languageKey);
  if (sourceBlock.value) void showCode(sourceBlock.value, source.value, ace);
});
/** One text node for the whole gutter, so a 65 536-line source adds one element, not thousands. */
const lineCount = computed(() => sourceLineCount(source.value));
const lineNumbers = computed(() =>
  Array.from({ length: lineCount.value }, (_unused, index) => index + 1).join('\n'),
);
/** The source opens folded, whatever its length; "View source" links (#source) open it unfolded. */
const isExpanded = ref(route.hash === '#source');
</script>

<template>
  <GlassCard id="source" as="div" class="scroll-mt-20 overflow-hidden rounded-panel">
    <div class="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-3">
      <h2 class="font-display text-base font-bold">{{ $t('submission.source.title') }}</h2>
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-if="data && isExpanded"
          type="button"
          aria-controls="source-code"
          :aria-expanded="true"
          class="inline-flex min-h-11 items-center rounded-pill border border-line px-4 text-sm font-semibold hover:bg-surface-hover"
          @click="isExpanded = false"
        >
          {{ $t('submission.source.collapse') }}
        </button>
        <RouterLink
          v-if="isOwn && problemCode && !forbiddenText"
          :to="{ name: 'problem', params: { code: problemCode }, query: { resubmit: id } }"
          class="inline-flex min-h-11 items-center rounded-pill bg-accent-soft px-4 text-sm font-semibold text-accent-soft-text"
          >{{ $t('submission.source.resubmit') }}</RouterLink
        >
      </div>
    </div>
    <p v-if="forbiddenText" class="flex flex-wrap items-center gap-3 px-6 pb-6 text-muted">
      <InlineBit kind="sweat" />{{ forbiddenText }}
    </p>
    <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><SourceViewSkeleton /></template>
      <div
        v-if="isExpanded"
        id="source-code"
        tabindex="0"
        role="region"
        :aria-label="$t('submission.source.title')"
        class="flex overflow-x-auto bg-surface-strong py-4 font-mono text-meta leading-relaxed focus-visible:-outline-offset-2"
      >
        <pre aria-hidden="true" class="shrink-0 pr-4 pl-6 text-right text-muted select-none">{{
          lineNumbers
        }}</pre>
        <pre ref="sourceBlock" class="pr-6"></pre>
      </div>
      <div v-else class="px-6 pb-5">
        <button
          type="button"
          data-testid="source-expand"
          aria-controls="source-code"
          :aria-expanded="false"
          class="flex min-h-11 w-full items-center justify-center rounded-row border border-dashed border-line bg-surface-strong px-5 font-mono text-sm font-semibold hover:bg-surface-hover"
          @click="isExpanded = true"
        >
          {{ $t('submission.source.expand', { count: lineCount }) }}
        </button>
      </div>
      <SourceFileBar
        v-if="data"
        :id="id"
        :filename="data.filename"
        :language-name="languageName"
        :text="source"
      />
    </QueryState>
  </GlassCard>
</template>
