<script setup lang="ts">
import { computed } from 'vue';
import type { BlockTone } from '@/lib/verdicts';
import { shareLabel, verdictShares } from './verdict-distribution';
import type { VerdictCount } from './verdict-distribution';

/** Today's judged submissions by result: one stacked bar (decorative) and its legend, which says the same in text. */
const props = defineProps<{ verdicts: readonly VerdictCount[] }>();
const shares = computed(() => verdictShares(props.verdicts));

/** Fill only: the bar and the legend swatches carry no text. */
const SEGMENT_CLASSES: Record<BlockTone, string> = {
  ac: 'bg-verdict-ac-solid',
  wa: 'bg-verdict-wa-solid',
  tle: 'bg-verdict-tle-solid',
  rte: 'bg-verdict-rte-solid',
  ce: 'bg-verdict-ce-solid',
  sys: 'bg-verdict-sys-solid',
  pending: 'bg-verdict-pending',
};
</script>

<template>
  <figure v-if="shares.length" data-testid="verdict-distribution" class="m-0 flex flex-col gap-1.5">
    <div aria-hidden="true" class="flex h-2.5 gap-0.5 overflow-hidden rounded-pill">
      <span
        v-for="share in shares"
        :key="share.result"
        :class="SEGMENT_CLASSES[share.tone]"
        :style="{ flexGrow: share.count }"
        class="block min-w-1 basis-0"
      />
    </div>
    <figcaption class="sr-only">{{ $t('submissions.stats.distribution') }}</figcaption>
    <ul class="m-0 flex list-none flex-wrap gap-x-3.5 gap-y-1 p-0 text-xs text-muted">
      <li
        v-for="share in shares"
        :key="share.result"
        :title="$t(`verdicts.${share.result}`)"
        class="inline-flex items-center gap-1.5"
      >
        <span
          aria-hidden="true"
          class="size-2.5 rounded-[3px]"
          :class="SEGMENT_CLASSES[share.tone]"
        />
        <span class="font-mono font-semibold">{{ share.result }}</span>
        <b class="font-mono text-content tabular-nums">{{ shareLabel(share) }}</b>
      </li>
    </ul>
  </figure>
</template>
