<script setup lang="ts">
import { serverNow } from '@/lib/server-clock';
import { computed, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { phaseAt } from '@/lib/contest-time';
import { SERVER_CATCH_UP_MS } from '@/theme/motion';
import ContestHeader from './bar/ContestHeader.vue';
import { provideBoardFrozen } from './bar/board-frozen-report';
import { useContestQuery } from './contests.queries';

/**
 * The frame of the contest's tab pages (problems, announcements, submissions, stats, ranking, replay).
 * The header, the plate and the tab strip live here, so they stay mounted while the tab changes and the tab indicator
 * can slide. Each tab page draws only its own content, under the tabs.
 */
const route = useRoute();
const key = computed(() => String(route.params.key));
const { data: contest, error, refetch } = useContestQuery(key);
const isBoardFrozen = provideBoardFrozen();
/** A contest that failed to load shows its page's own dead end or retry, not a header with no name. */
const hasFailed = computed(() => error.value !== null && contest.value === undefined);

let catchUpTimer: ReturnType<typeof setTimeout> | undefined;
/** The server still reports the phase the clock has left behind. */
const serverLagsClock = () =>
  contest.value !== undefined && phaseAt(contest.value, serverNow()) !== contest.value.phase;
/** The plate's clock reached its target (the start, the end): the contest is read again for its new phase. */
function onCountdownElapsed() {
  void refetch();
  clearTimeout(catchUpTimer);
  catchUpTimer = setTimeout(() => {
    if (serverLagsClock()) void refetch();
  }, SERVER_CATCH_UP_MS);
}
onBeforeUnmount(() => clearTimeout(catchUpTimer));
</script>

<template>
  <div class="page-column">
    <ContestHeader
      v-if="!hasFailed"
      :contest-key="key"
      :contest="contest"
      :is-board-frozen="isBoardFrozen"
      @elapsed="onCountdownElapsed"
    />
    <RouterView />
  </div>
</template>
