<script setup lang="ts">
import { computed } from 'vue';
import StateBit from '@/components/StateBit.vue';
import { REPLAY_BITS } from './replay-bits';
import type { ReplayPanelState } from './replay-bits';

/** Every replay state that is not a board: Bit (from `REPLAY_BITS`), a heading, a line, and the one action that helps. */
const props = withDefaults(
  defineProps<{ state: ReplayPanelState; contestKey: string; isCompact?: boolean }>(),
  { isCompact: false },
);
defineEmits<{ retry: [] }>();

const ALERT_STATES: ReplayPanelState[] = ['error', 'forbidden', 'frozen'];
/** The contest is there, only its replay is not: the ranking still helps. */
const RANKING_LINK_STATES: ReplayPanelState[] = ['frozen', 'forbidden', 'unsupported', 'notEnded'];
const bit = computed(() => REPLAY_BITS[props.state]);
/** Building is announced politely (it changes to the board by itself); refusals are alerts. */
const role = computed(() => {
  if (ALERT_STATES.includes(props.state)) return 'alert';
  return props.state === 'building' ? 'status' : undefined;
});
const hasRankingLink = computed(() => RANKING_LINK_STATES.includes(props.state));
</script>

<template>
  <section
    data-testid="replay-state"
    :data-state="state"
    :role="role"
    class="glass flex flex-col items-center gap-3 rounded-card px-6 text-center"
    :class="isCompact ? 'py-6' : 'py-10'"
  >
    <StateBit
      :variant="bit.variant"
      :label="$t(bit.labelKey)"
      :size="isCompact ? 'inline' : 'panel'"
    />
    <h2 class="font-display text-xl font-semibold text-content">
      {{ $t(`replay.states.${state}.title`) }}
    </h2>
    <p class="max-w-md text-muted">{{ $t(`replay.states.${state}.body`) }}</p>
    <button
      v-if="state === 'error'"
      type="button"
      class="min-h-11 rounded-pill border border-line px-4 font-semibold hover:bg-surface-hover"
      @click="$emit('retry')"
    >
      {{ $t('replay.states.retry') }}
    </button>
    <RouterLink
      v-else-if="hasRankingLink"
      :to="{ name: 'contest-ranking', params: { key: contestKey } }"
      class="inline-flex min-h-11 items-center rounded-pill border border-line px-4 font-semibold hover:bg-surface-hover"
    >
      {{ $t('replay.states.backToRanking') }}
    </RouterLink>
  </section>
</template>
