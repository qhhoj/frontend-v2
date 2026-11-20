<script setup lang="ts">
import { computed } from 'vue';
import type { VerdictTone } from '@/lib/verdicts';
import Lamp from './Lamp.vue';

/** A mark on the scale: a time (ms since the epoch) and its label ("0:00", "2:30"). */
export interface TimelineTick {
  at: number;
  label: string;
}
/** Something that happened at a time, drawn as a lamp above the track; `label` is read out and shown on hover ("1:12 Bài C: sai"). */
export interface TimelineEvent {
  at: number;
  tone: VerdictTone;
  label: string;
}

/**
 * A contest as a time scale: the track from `start` to `end`, the part already past, a needle at `now`, the freeze
 * zone hatched amber from `freezeAt` to the end, ticks with labels, and events (my submissions) as lamps. All times
 * are milliseconds since the epoch; the caller updates `now`. Nothing animates. Made for a `Readout`.
 */
defineOptions({ name: 'UiContestTimeline' });
const props = withDefaults(
  defineProps<{
    start: number;
    end: number;
    now: number;
    freezeAt?: number | null;
    ticks?: readonly TimelineTick[];
    events?: readonly TimelineEvent[];
    /** Names the timeline ("Tiến trình kỳ thi"). */
    label: string;
    /** What the needle says ("Bây giờ: 1:45"); without it the needle is decorative. */
    nowLabel?: string;
    /** What the hatched zone says ("Đóng băng bảng điểm từ 2:30"). */
    freezeLabel?: string;
  }>(),
  {
    freezeAt: null,
    ticks: () => [],
    events: () => [],
    nowLabel: undefined,
    freezeLabel: undefined,
  },
);

const percentOf = (at: number) => {
  const length = props.end - props.start;
  return length > 0 ? Math.min(Math.max(((at - props.start) / length) * 100, 0), 100) : 0;
};
const nowPercent = computed(() => percentOf(props.now));
const freezePercent = computed(() =>
  props.freezeAt === null ? null : 100 - percentOf(props.freezeAt),
);
/** A label is centred on its tick; the first and the last stay inside the track's ends. */
const tickLabelShift = (at: number) => {
  if (at <= props.start) return '';
  return at >= props.end ? '-translate-x-full' : '-translate-x-1/2';
};
</script>

<template>
  <div role="group" :aria-label="label" class="relative h-12">
    <div class="absolute inset-x-0 top-4 h-2 overflow-hidden rounded-pill bg-surface-strong">
      <div
        class="absolute inset-y-0 left-0 bg-content opacity-90"
        :style="{ width: `${nowPercent}%` }"
      />
      <div
        v-if="freezePercent !== null"
        :title="freezeLabel"
        :role="freezeLabel ? 'img' : undefined"
        :aria-label="freezeLabel"
        class="timeline-freeze absolute inset-y-0 right-0"
        :style="{ width: `${freezePercent}%` }"
      />
    </div>
    <span
      v-for="tick in ticks"
      :key="tick.at"
      class="absolute top-6 h-1 w-px bg-muted"
      :style="{ left: `${percentOf(tick.at)}%` }"
    >
      <span
        class="absolute top-2 left-0 font-mono text-kbd font-medium whitespace-nowrap text-muted"
        :class="tickLabelShift(tick.at)"
        >{{ tick.label }}</span
      >
    </span>
    <span
      :title="nowLabel"
      :role="nowLabel ? 'img' : undefined"
      :aria-label="nowLabel"
      :aria-hidden="nowLabel ? undefined : 'true'"
      class="absolute top-2 h-6 w-0.5 -translate-x-1/2 rounded-pill bg-content"
      :style="{ left: `${nowPercent}%` }"
    />
    <Lamp
      v-for="(event, index) in events"
      :key="index"
      :tone="event.tone"
      :label="event.label"
      size="event"
      still
      class="absolute top-0.5 -translate-x-1/2"
      :style="{ left: `${percentOf(event.at)}%` }"
    />
  </div>
</template>
