<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { computed, onMounted, ref, toRef, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import type { SourceAccess } from '@/api/types/submissions';
import Card from '@/components/ui/Card.vue';
import Notice from '@/components/ui/Notice.vue';
import QueryState from '@/components/QueryState.vue';
import { aceForSubmissionKey } from '@/components/code-language-keys';
import { showCode } from '@/components/code-highlight';
import { translate } from '@/i18n';
import { normalizeNewlines, sourceLineCount } from '@/lib/source';
import { forbiddenReasonKey, isForbidden } from './forbidden-reason';
import { safeRedirect } from '@/router/safe-redirect';
import SourceFileBar from './SourceFileBar.vue';
import SourceViewSkeleton from './SourceViewSkeleton.vue';
import { useSubmissionSourceQuery } from './submissions.queries';

/**
 * The source card. The source is asked for only with `access` granted; otherwise (and on a 401 or 403 from the source
 * endpoint) a notice says why, with "Đăng nhập" for a visitor. The default slot (the compare link) shows with the source.
 * Keep `SourceViewSkeleton.vue` in step: same card, header and line classes.
 */
const props = defineProps<{
  id: string;
  access: SourceAccess;
  languageKey: string | null;
  languageName: string | null;
}>();
const route = useRoute();
/** "View source" in a submission list links here: the page loads before this card exists, so the hash is applied on mount. */
onMounted(() => {
  if (route.hash === '#source') document.getElementById('source')?.scrollIntoView();
});
const isGranted = computed(() => props.access === 'granted');
const { data, isPending, error, refetch } = useSubmissionSourceQuery(toRef(props, 'id'), isGranted);
const LOCKED_KEYS: Record<Exclude<SourceAccess, 'granted'>, string> = {
  sign_in: 'submission.sourceLocked.signIn',
  solve_first: 'submission.sourceLocked.solveFirst',
  hidden: 'submission.sourceHidden',
};
const isSignedOut = computed(
  () =>
    props.access === 'sign_in' || (error.value instanceof ApiError && error.value.status === 401),
);
/** Why there is no source: the detail's answer first; a 401 or 403 is a reason to show, not an error to retry. */
const lockedText = computed(() => {
  if (props.access !== 'granted') return translate(LOCKED_KEYS[props.access]);
  if (isSignedOut.value) return translate(LOCKED_KEYS.sign_in);
  const key =
    forbiddenReasonKey(error.value) ??
    (isForbidden(error.value) ? 'submission.sourceHidden' : null);
  return key === null ? null : translate(key);
});
const loginTo = computed(() => ({
  name: 'login',
  query: { redirect: safeRedirect(route.fullPath) },
}));
/** A stored source may end its lines in CR alone (a file read before the editor normalized files), which a `<pre>` shows as one line. */
const source = computed(() => normalizeNewlines(data.value?.source ?? ''));
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
  <Card id="source" as="div" class="scroll-mt-20 overflow-hidden rounded-card">
    <div class="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-3">
      <h2 class="section-title">{{ $t('submission.source.title') }}</h2>
      <div class="flex flex-wrap items-center gap-2">
        <AppButton
          v-if="data && isExpanded"
          aria-controls="source-code"
          :aria-expanded="true"
          @click="isExpanded = false"
        >
          {{ $t('submission.source.collapse') }}
        </AppButton>
      </div>
    </div>
    <div v-if="lockedText" data-testid="source-locked" class="px-6 pb-6">
      <!-- compact: the sign-in button goes under the text, which keeps its width on a phone. -->
      <Notice compact>
        {{ lockedText }}
        <template v-if="isSignedOut" #action>
          <AppButton size="sm" class="mt-2" :to="loginTo">{{
            $t('submission.sourceLocked.signInAction')
          }}</AppButton>
        </template>
      </Notice>
    </div>
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
      <slot v-if="data" />
    </QueryState>
  </Card>
</template>
