<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import Card from '@/components/ui/Card.vue';
import { Pause, Play } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { formatDuration } from '@/lib/format';
import type { SolveMark } from './replay-timeline';
import { REPLAY_SPEEDS } from './use-replay-player';
import type { ReplaySpeed } from './use-replay-player';

/**
 * Player: play/pause, clock, speeds, the scrub track with first-solve dots, the legend. The rows have fixed heights at
 * every width (row 1 wraps the speeds under play + clock at 375 px), so the skeleton can mirror them.
 */
const props = defineProps<{
  seconds: number;
  durationSeconds: number;
  isPlaying: boolean;
  speed: ReplaySpeed;
  marks: SolveMark[];
}>();
const emit = defineEmits<{
  play: [];
  pause: [];
  seek: [seconds: number];
  speed: [speed: ReplaySpeed];
}>();

const clock = computed(() => formatDuration(props.seconds));
const total = computed(() => formatDuration(props.durationSeconds));
const togglePlay = () => (props.isPlaying ? emit('pause') : emit('play'));
/** While the thumb is held, it stays where the hand put it: the running clock must not drag it away (x300 moves 75 s a tick). */
const heldSecond = ref<number | null>(null);
const thumbSecond = computed(() => heldSecond.value ?? Math.floor(props.seconds));
const release = () => (heldSecond.value = null);
/** The release may land outside the slider, so it is heard on the window. */
function hold() {
  heldSecond.value = Math.floor(props.seconds);
  window.addEventListener('pointerup', release, { once: true });
  window.addEventListener('pointercancel', release, { once: true });
}
function onScrub(event: Event) {
  const second = Number((event.target as HTMLInputElement).value);
  if (heldSecond.value !== null) heldSecond.value = second;
  emit('seek', second);
}
</script>

<template>
  <Card
    :aria-label="$t('replay.player.label')"
    data-replay-part="player"
    class="flex flex-col gap-3 p-4 sm:p-5"
  >
    <div class="flex flex-wrap items-center gap-3">
      <AppButton tone="primary" @click="togglePlay">
        <template #icon>
          <Pause v-if="isPlaying" class="size-4" aria-hidden="true" />
          <Play v-else class="size-4" aria-hidden="true" />
        </template>
        {{ isPlaying ? $t('replay.player.pause') : $t('replay.player.play') }}
      </AppButton>
      <p class="font-mono tabular-nums">
        {{ clock }} <span class="text-muted">/ {{ total }}</span>
      </p>
      <span class="hidden flex-1 sm:block" />
      <div
        role="group"
        :aria-label="$t('replay.player.speed')"
        class="flex rounded-pill bg-surface-strong p-1"
      >
        <button
          v-for="option in REPLAY_SPEEDS"
          :key="option"
          type="button"
          :aria-pressed="speed === option"
          :aria-label="$t('replay.player.speedOption', { speed: option })"
          class="min-h-11 min-w-11 rounded-pill px-3 text-sm"
          :class="
            speed === option
              ? 'bg-gradient-accent font-bold text-on-accent'
              : 'text-content hover:bg-surface-hover'
          "
          @click="emit('speed', option)"
        >
          x{{ option }}
        </button>
      </div>
    </div>
    <div class="relative">
      <span
        v-for="mark in marks"
        :key="mark.problemId"
        aria-hidden="true"
        data-testid="solve-mark"
        class="pointer-events-none absolute top-0 size-2 -translate-x-1/2 rounded-full bg-verdict-ac"
        :style="{ left: `${mark.percent}%` }"
      />
      <input
        type="range"
        min="0"
        :max="durationSeconds"
        step="1"
        :value="thumbSecond"
        :aria-label="$t('replay.player.scrub')"
        :aria-valuetext="clock"
        class="mt-2 h-11 w-full accent-accent"
        @pointerdown="hold"
        @change="release"
        @input="onScrub"
      />
    </div>
    <div aria-hidden="true" class="flex justify-between font-mono text-xs text-muted tabular-nums">
      <span>00:00</span>
      <span>{{ total }}</span>
    </div>
    <p class="text-xs text-muted">{{ $t('replay.player.marksLegend') }}</p>
  </Card>
</template>
