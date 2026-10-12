<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import Card from '@/components/ui/Card.vue';
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
/** States that change to the board by themselves (the page polls them): announced politely. */
const STATUS_STATES: ReplayPanelState[] = ['building', 'notReady'];
/** A failed or not-yet-queued read: asking again now may help. */
const RETRY_STATES: ReplayPanelState[] = ['error', 'notReady'];
/** The contest is there, only its replay is not: the ranking still helps. */
const RANKING_LINK_STATES: ReplayPanelState[] = ['frozen', 'forbidden', 'unsupported', 'notEnded'];
const bit = computed(() => REPLAY_BITS[props.state]);
/** Refusals are alerts. */
const role = computed(() => {
  if (ALERT_STATES.includes(props.state)) return 'alert';
  return STATUS_STATES.includes(props.state) ? 'status' : undefined;
});
const hasRetry = computed(() => RETRY_STATES.includes(props.state));
const hasRankingLink = computed(() => RANKING_LINK_STATES.includes(props.state));
</script>

<template>
  <Card
    data-testid="replay-state"
    :data-state="state"
    :role="role"
    class="flex flex-col items-center gap-3 px-6 text-center"
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
    <AppButton v-if="hasRetry" @click="$emit('retry')">
      {{ $t('replay.states.retry') }}
    </AppButton>
    <AppButton
      v-else-if="hasRankingLink"
      :to="{ name: 'contest-ranking', params: { key: contestKey } }"
    >
      {{ $t('replay.states.backToRanking') }}
    </AppButton>
  </Card>
</template>
