<script setup lang="ts">
import { computed } from 'vue';
import type { SubmissionListItem } from '@/api/types/submissions';
import { VERDICT_TEXT_CLASSES } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { isFinished, scoreCellText, scoreParts, scoreToneOf } from './submission-row';

/**
 * A list row's score: the earned points in the result's colour, the maximum muted after it ("560/800"). No tint and
 * no box: with the lamp and the verdict code this is the only colour of a row. A row being graded shows how far the
 * judging got instead ("3/10"), muted; a queued one nothing (its verdict mark says so).
 */
const props = defineProps<{
  row: SubmissionListItem;
  /** The contest problem's points: the score reads as contest points over it. */
  contestMax?: number;
  /** No spaces around the slash, for a narrow row. */
  tight?: boolean;
}>();
const locale = useLocaleStore();
const parts = computed(() =>
  isFinished(props.row) ? scoreParts(props.row, locale.locale, props.contestMax) : null,
);
const tone = computed(() => scoreToneOf(props.row, props.contestMax));
const progress = computed(() =>
  parts.value ? '' : scoreCellText(props.row, locale.locale, props.contestMax, props.tight),
);
</script>

<template>
  <span v-if="parts" class="font-mono text-sm whitespace-nowrap tabular-nums">
    <span class="font-bold" :class="tone ? VERDICT_TEXT_CLASSES[tone] : 'text-content'">{{
      parts.earned
    }}</span
    ><span v-if="parts.max" class="text-muted">/{{ parts.max }}</span>
  </span>
  <span
    v-else-if="progress"
    data-testid="grading-progress"
    class="font-mono text-small whitespace-nowrap text-muted tabular-nums"
    >{{ progress }}</span
  >
</template>
