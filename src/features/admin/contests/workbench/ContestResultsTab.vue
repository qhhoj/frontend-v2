<script setup lang="ts">
import type { EditableContest } from '@/api/types/contest-editing';
import PageSection from '@/components/ui/PageSection.vue';
import ContestActionsTab from '../actions/ContestActionsTab.vue';
import ContestGhostsTab from '../ghosts/ContestGhostsTab.vue';
import ContestRankingTab from '../ranking/ContestRankingTab.vue';
import { RESULTS_ANCHORS } from './contest-workbench-tabs';

/**
 * The "Kết quả" tab: what a teacher does with the results. The ranking link and the official ranking, then scoring
 * and judging jobs, the per-problem tools, the freeze and lock, publishing the problems after the contest, and ghost
 * rows. Each card acts at once, as it did on its old tab.
 */
defineProps<{ contest: EditableContest }>();
const KEY = 'admin.contests.workbench.results';
</script>

<template>
  <div class="flex flex-col gap-8" data-testid="contest-results">
    <PageSection :title="$t(`${KEY}.ranking`)">
      <ContestRankingTab :contest="contest" />
    </PageSection>
    <ContestActionsTab :contest="contest" />
    <PageSection :id="RESULTS_ANCHORS.ghosts" :title="$t('admin.ghosts.tab')">
      <ContestGhostsTab :contest="contest" />
    </PageSection>
  </div>
</template>
