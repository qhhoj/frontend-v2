<script setup lang="ts">
import { computed } from 'vue';
import { formatInZone } from '../../ui/form/site-time';
import { timelineOf } from './contest-timeline';
import type { TimelineInput, TimelineKey } from './contest-timeline';

/**
 * The time section's overview: a bar from the earliest to the latest moment with the run and the frozen stretch, then
 * every moment as a dot, a name and its site-zone time. The legend carries the meaning; the bar only repeats it.
 */
const props = defineProps<{ times: TimelineInput }>();
const timeline = computed(() => timelineOf(props.times));
const DOT: Record<TimelineKey, string> = {
  registrationStart: 'bg-muted',
  start: 'bg-accent',
  freeze: 'bg-tag-5',
  end: 'bg-content',
  lockedAfter: 'bg-muted',
};
/** `dd/mm hh:mm`: the year is in the fields below. */
const shortTime = (iso: string) => {
  const text = formatInZone(iso);
  return `${text.slice(0, 5)} ${text.slice(11)}`;
};
const percent = (fraction: number) => `${(fraction * 100).toFixed(2)}%`;
</script>

<template>
  <div
    v-if="timeline"
    data-testid="contest-timeline"
    class="flex flex-col gap-3 rounded-cell border border-line bg-surface-solid p-3 lg:col-span-2"
  >
    <div aria-hidden="true" class="relative mx-1.5 h-3">
      <span
        class="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-pill bg-surface-strong"
      />
      <span
        class="absolute top-1/2 h-1 -translate-y-1/2 rounded-pill bg-accent"
        :style="{
          left: percent(timeline.run.from),
          width: percent(timeline.run.to - timeline.run.from),
        }"
      />
      <span
        v-if="timeline.freeze"
        class="absolute top-1/2 h-1 -translate-y-1/2 rounded-pill bg-tag-5"
        :style="{
          left: percent(timeline.freeze.from),
          width: percent(timeline.freeze.to - timeline.freeze.from),
        }"
      />
      <span
        v-for="point in timeline.points"
        :key="point.key"
        class="absolute top-1/2 size-3 -translate-1/2 rounded-full border-2 border-surface-solid"
        :class="DOT[point.key]"
        :style="{ left: percent(point.position) }"
      />
    </div>
    <ol class="m-0 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0 text-[13px]">
      <li v-for="point in timeline.points" :key="point.key" class="flex items-center gap-1.5">
        <span aria-hidden="true" class="size-2 shrink-0 rounded-full" :class="DOT[point.key]" />
        <span class="text-muted">{{ $t(`admin.contests.general.timeline.${point.key}`) }}</span>
        <span class="font-mono tabular-nums">{{ shortTime(point.at) }}</span>
      </li>
    </ol>
  </div>
</template>
