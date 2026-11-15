<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import ContestHeader from './bar/ContestHeader.vue';
import { provideBoardFrozen } from './bar/board-frozen-report';
import { useContestQuery } from './contests.queries';

/**
 * The frame of the contest's tab pages (problems, announcements, submissions, stats, ranking, replay).
 * The header and the tab strip live here, so they stay mounted while the tab changes and the tab indicator can slide.
 * Each tab page draws only its own content, under the header.
 */
const route = useRoute();
const key = computed(() => String(route.params.key));
const { data: contest, error, refetch } = useContestQuery(key);
const isBoardFrozen = provideBoardFrozen();
/** A contest that failed to load shows its page's own dead end or retry, not a header with no name. */
const hasFailed = computed(() => error.value !== null && contest.value === undefined);
</script>

<template>
  <div class="page-column">
    <ContestHeader
      v-if="!hasFailed"
      :contest-key="key"
      :contest="contest"
      :is-board-frozen="isBoardFrozen"
      @elapsed="refetch()"
    />
    <RouterView />
  </div>
</template>
