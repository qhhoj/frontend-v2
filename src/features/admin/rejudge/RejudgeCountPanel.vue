<script setup lang="ts">
import { computed } from 'vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { formatClock } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import AdminChip from '../ui/AdminChip.vue';
import type { ChipTone } from '../ui/AdminChip.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { needsPermissionText } from '../ui/permission-text';
import { BULK_REJUDGE_LIMIT } from './use-rejudge-count';
import type { RejudgeCountState } from './use-rejudge-count';

const props = defineProps<{ state: RejudgeCountState }>();
const locale = useLocaleStore();

interface CountView {
  figure: string;
  chip: string;
  tone: ChipTone;
  sentence: string;
}

/** What the inset block says for a counting or counted state; `ready` is worded by its permission and its size. */
const view = computed<CountView | null>(() => {
  const state = props.state;
  const say = (key: string, values: Record<string, unknown> = {}) =>
    translate(`admin.rejudge.confirm.count.${key}`, values);
  if (state.kind === 'counting')
    return { figure: '…', chip: say('counting'), tone: 'neutral', sentence: say('countingText') };
  if (state.kind !== 'ready') return null;
  const figure = formatNumber(state.count, locale.locale);
  if (!state.allowed)
    return {
      figure,
      chip: say('needsLotChip'),
      tone: 'negative',
      sentence: say('needsLot', {
        limit: BULK_REJUDGE_LIMIT,
        permission: needsPermissionText('judge.rejudge_submission_lot'),
      }),
    };
  if (state.count === 0)
    return { figure, chip: say('noneChip'), tone: 'neutral', sentence: say('none') };
  const time = formatClock(state.countedAt);
  return {
    figure,
    chip: say('allowedChip'),
    tone: 'positive',
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
      <span class="font-mono text-stat leading-9 font-bold">{{ view.figure }}</span>
      <AdminChip :tone="view.tone">{{ view.chip }}</AdminChip>
    </div>
    <p class="text-sm">{{ view.sentence }}</p>
  </div>
</template>
