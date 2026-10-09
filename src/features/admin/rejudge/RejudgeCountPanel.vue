<script setup lang="ts">
import { computed } from 'vue';
import { translate } from '@/i18n';
import { formatClock, formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminStatus from '../ui/AdminStatus.vue';
import { BULK_REJUDGE_LIMIT } from './use-rejudge-count';
import type { RejudgeCountState } from './use-rejudge-count';

const props = defineProps<{ state: RejudgeCountState }>();
const locale = useLocaleStore();
const CHIP = 'inline-flex items-center rounded-pill border px-2.5 py-0.5 text-xs font-semibold';
const NEUTRAL = `${CHIP} border-line bg-accent-soft text-accent-soft-text`;
const GOOD = `${CHIP} border-line text-positive`;
const BAD = `${CHIP} border-negative text-negative`;

interface CountView {
  figure: string;
  chip: string;
  tone: string;
  sentence: string;
}

/** What the inset block says for a counting or counted state; `ready` is worded by its permission and its size. */
const view = computed<CountView | null>(() => {
  const state = props.state;
  const say = (key: string, values: Record<string, unknown> = {}) =>
    translate(`admin.rejudge.confirm.count.${key}`, values);
  if (state.kind === 'counting')
    return { figure: '…', chip: say('counting'), tone: NEUTRAL, sentence: say('countingText') };
  if (state.kind !== 'ready') return null;
  const figure = formatNumber(state.count, locale.locale);
  if (!state.allowed)
    return {
      figure,
      chip: say('needsLotChip'),
      tone: BAD,
      sentence: say('needsLot', { limit: BULK_REJUDGE_LIMIT }),
    };
  if (state.count === 0)
    return { figure, chip: say('noneChip'), tone: NEUTRAL, sentence: say('none') };
  const time = formatClock(state.countedAt, locale.locale);
  return {
    figure,
    chip: say('allowedChip'),
    tone: GOOD,
    sentence: `${say('matching')} ${say('countedAt', { time })}`,
  };
});
</script>

<template>
  <AdminStatus v-if="state.kind === 'failed'" kind="refused" :text="state.text" />
  <div
    v-else-if="view"
    role="status"
    :aria-busy="state.kind === 'counting' || undefined"
    class="flex flex-col gap-2 rounded-row bg-surface-hover p-4"
  >
    <div class="flex flex-wrap items-center gap-3">
      <span class="font-mono text-3xl font-bold">{{ view.figure }}</span>
      <span :class="view.tone">{{ view.chip }}</span>
    </div>
    <p class="text-sm">{{ view.sentence }}</p>
  </div>
</template>
