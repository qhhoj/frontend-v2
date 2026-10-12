<script setup lang="ts">
import { computed } from 'vue';
import type { SubmissionListItem } from '@/api/types/submissions';
import BitLoop from '@/components/BitLoop.vue';
import { translate } from '@/i18n';
import { BLOCK_TONE_CLASSES, blockToneOf, verdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { NO_VALUE, gradingPercent, isFinished, scoreText } from './submission-row';

/**
 * The left block of a submission row: the verdict code on a solid fill over the score ("738.46 / 1000"). A row still being
 * judged shows its status and, while grading, the share judged so far, with the judging Bit (decorative, still under reduced
 * motion and low power) in the block's free corner; the block's size never depends on it. `compact` is the phone's narrower block.
 */
const props = defineProps<{ row: SubmissionListItem; compact?: boolean }>();
const locale = useLocaleStore();
const verdict = computed(() => verdictOf(props.row));
const label = computed(() =>
  verdict.value.code === 'G'
    ? translate(props.compact ? 'submissions.gradingShort' : verdict.value.labelKey)
    : verdict.value.code,
);
const detail = computed(() => {
  if (isFinished(props.row)) return scoreText(props.row, locale.locale, props.compact);
  const { code, labelKey } = verdict.value;
  if (code === 'G') return gradingPercent(props.row);
  if (code === 'QU')
    return translate(props.compact ? 'submissions.queuedShort' : 'submissions.queued');
  return code === 'P' ? translate(labelKey) : '';
});
const rowLabel = computed(() =>
  translate('submissions.rowLabel', {
    id: props.row.id,
    user: props.row.user?.username ?? NO_VALUE,
    problem: props.row.problem?.name ?? NO_VALUE,
    verdict: translate(verdict.value.labelKey),
  }),
);
</script>

<template>
  <RouterLink
    :to="{ name: 'submission', params: { id: row.id } }"
    :aria-label="rowLabel"
    :title="$t(verdict.labelKey)"
    class="relative flex min-h-12 flex-col justify-center gap-0.5 overflow-hidden rounded-cell px-2.5 py-1.5 hover:brightness-110"
    :class="[BLOCK_TONE_CLASSES[blockToneOf(verdict)], compact ? 'w-24' : 'w-[7.875rem]']"
  >
    <span class="font-display text-sm leading-[1.1] font-bold whitespace-nowrap">{{ label }}</span>
    <span
      v-if="detail"
      class="truncate font-mono leading-tight"
      :class="compact ? 'text-tiny' : 'text-xs'"
      >{{ detail }}</span
    >
    <BitLoop
      v-if="verdict.code === 'G' && !compact"
      kind="judging"
      class="absolute top-1/2 right-1.5 -translate-y-1/2 [--bit-px:1.5px]"
    />
  </RouterLink>
</template>
