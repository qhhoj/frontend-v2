<script setup lang="ts">
import { computed } from 'vue';
import InlineBit from '@/components/InlineBit.vue';
import QueryState from '@/components/QueryState.vue';
import SourceDiff from '@/components/SourceDiff.vue';
import SourceDiffSkeleton from '@/components/SourceDiffSkeleton.vue';
import StatePanel from '@/components/StatePanel.vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { isIdentical, lineDiff, MAX_DIFF_LINES } from '@/lib/line-diff';
import { useLocaleStore } from '@/stores/locale.store';
import { useViewerId } from '@/stores/use-viewer-id';
import DiffSideHeader from './DiffSideHeader.vue';
import { DIFF_INLINE_BITS, DIFF_STATE_PANELS } from './diff-bits';
import type { DiffPair } from './diff-picks';
import { diffViewState } from './diff-state';
import type { DiffSide } from './diff-state';
import { submissionShortId } from './submission-short-id';
import { useDiffSide } from './use-diff-side';

/** Mounted only with a valid pair, so no request leaves for a bad query. */
const props = defineProps<{ pair: DiffPair }>();
const locale = useLocaleStore();
const viewerId = useViewerId();
const sides = {
  left: useDiffSide(computed(() => props.pair.left)),
  right: useDiffSide(computed(() => props.pair.right)),
};
const state = computed(() =>
  diffViewState({ left: sides.left.input.value, right: sides.right.input.value }),
);
const rows = computed(() =>
  state.value.kind === 'ready' ? lineDiff(state.value.leftSource, state.value.rightSource) : [],
);
const isSame = computed(() => state.value.kind === 'ready' && isIdentical(rows.value));
const otherSide = (side: DiffSide): DiffSide => (side === 'left' ? 'right' : 'left');
const sideWord = (side: DiffSide) => translate(`sourceDiff.side.${side}`).toLowerCase();
/** The problem side's id, and its author when the detail was readable (the named forbidden state). */
const problemSide = computed(() => ('side' in state.value ? state.value.side : null));
function forbiddenTitle(side: DiffSide) {
  const id = submissionShortId(props.pair[side]);
  const user = sides[side].detail.data.value?.user?.username;
  return user
    ? translate('sourceDiff.forbiddenTitleNamed', { id, user })
    : translate('sourceDiff.forbiddenTitle', { id });
}
/** Board M6C: when the other side is the viewer's own, say so (the board's "still yours" line). */
function forbiddenBody(side: DiffSide) {
  const other = otherSide(side);
  const isOtherOwn = sides[other].detail.data.value?.user?.id === viewerId.value;
  if (!isOtherOwn) return translate('sourceDiff.forbiddenBody', { side: sideWord(side) });
  return translate('sourceDiff.forbiddenBodyOwn', {
    side: sideWord(side),
    otherSide: sideWord(other),
    otherId: submissionShortId(props.pair[other]),
  });
}
const languages = computed(() => {
  const left = sides.left.detail.data.value?.language;
  const right = sides.right.detail.data.value?.language;
  return left && right && left.id !== right.id ? { left: left.name, right: right.name } : null;
});
const format = (value: number) => formatNumber(value, locale.locale);
const SIDES: readonly DiffSide[] = ['left', 'right'];
</script>

<template>
  <div class="grid gap-3 md:grid-cols-2">
    <DiffSideHeader
      :id="pair.left"
      :label="$t('sourceDiff.side.left')"
      :detail="sides.left.detail.data.value"
    />
    <DiffSideHeader
      :id="pair.right"
      :label="$t('sourceDiff.side.right')"
      :detail="sides.right.detail.data.value"
    />
  </div>
  <StatePanel
    v-if="state.kind === 'forbidden' && problemSide"
    :kind="DIFF_STATE_PANELS.forbidden"
    :title="forbiddenTitle(problemSide)"
    :body="forbiddenBody(problemSide)"
  >
    <RouterLink
      :to="{ name: 'submission', params: { id: pair[otherSide(problemSide)] } }"
      class="inline-flex min-h-11 items-center rounded-pill border border-line px-5 font-semibold hover:bg-surface-hover"
      >{{ $t('sourceDiff.pickOther', { side: sideWord(problemSide) }) }}</RouterLink
    >
  </StatePanel>
  <StatePanel
    v-else-if="state.kind === 'notFound' && problemSide"
    :kind="DIFF_STATE_PANELS.notFound"
    :title="$t('sourceDiff.notFoundTitle', { id: submissionShortId(pair[problemSide]) })"
    :body="$t('sourceDiff.notFoundBody', { side: sideWord(problemSide) })"
  >
    <RouterLink
      :to="{ name: 'submissions' }"
      class="inline-flex min-h-11 items-center rounded-pill border border-line px-5 font-semibold hover:bg-surface-hover"
      >{{ $t('sourceDiff.toList') }}</RouterLink
    >
  </StatePanel>
  <StatePanel
    v-else-if="state.kind === 'error' && problemSide"
    :kind="DIFF_STATE_PANELS.error"
    :title="$t('sourceDiff.errorTitle')"
    :body="$t('sourceDiff.errorBody', { id: submissionShortId(pair[problemSide]) })"
  >
    <button
      type="button"
      class="inline-flex min-h-11 items-center rounded-pill border border-line px-5 font-semibold hover:bg-surface-hover"
      @click="sides[problemSide].refetch()"
    >
      {{ $t('common.retry') }}
    </button>
  </StatePanel>
  <StatePanel
    v-else-if="state.kind === 'tooLong'"
    :kind="DIFF_STATE_PANELS.tooLong"
    :title="$t('sourceDiff.tooLongTitle')"
    :body="
      $t('sourceDiff.tooLongBody', {
        count: format(state.lineCount),
        limit: format(MAX_DIFF_LINES),
      })
    "
  >
    <RouterLink
      v-for="side in SIDES"
      :key="side"
      :to="{ name: 'submission', params: { id: pair[side] } }"
      class="inline-flex min-h-11 items-center rounded-pill border border-line px-5 font-semibold hover:bg-surface-hover"
      >{{ $t(side === 'left' ? 'sourceDiff.viewLeft' : 'sourceDiff.viewRight') }}</RouterLink
    >
  </StatePanel>
  <QueryState v-else :loading="state.kind === 'loading'" :error="null">
    <template #skeleton><SourceDiffSkeleton /></template>
    <StatePanel
      v-if="isSame"
      :kind="DIFF_STATE_PANELS.identical"
      :title="$t('sourceDiff.identicalTitle')"
      :body="$t('sourceDiff.identicalBody')"
    />
    <template v-else>
      <p
        v-if="languages"
        data-testid="diff-languages"
        role="note"
        class="flex flex-wrap items-center gap-3 rounded-tile border border-line px-4 py-3 text-sm"
      >
        <InlineBit :kind="DIFF_INLINE_BITS.languages" />
        <span
          ><strong>{{ $t('sourceDiff.languagesTitle') }}</strong>
          {{ $t('sourceDiff.languagesBody', languages) }}</span
        >
      </p>
      <SourceDiff :rows="rows" />
    </template>
  </QueryState>
</template>
