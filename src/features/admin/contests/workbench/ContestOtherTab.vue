<script setup lang="ts">
import type { EditableContest } from '@/api/types/contest-editing';
import PageSection from '@/components/ui/PageSection.vue';
import ContestCloneCard from '../actions/ContestCloneCard.vue';
import ContestDataCard from '../actions/ContestDataCard.vue';
import ContestDeleteCard from '../actions/ContestDeleteCard.vue';
import ContestDataTab from '../data/ContestDataTab.vue';

/**
 * The "Khác" tab: what few contests need. Exporting the data and the event feed key, preparing the problems' data,
 * a copy of the contest, and deleting it (last). Each card acts at once, as it did on its old tab.
 */
defineProps<{ contest: EditableContest }>();
const KEY = 'admin.contests.workbench.other';
</script>

<template>
  <div class="flex flex-col gap-8" data-testid="contest-other">
    <PageSection :title="$t(`${KEY}.data`)">
      <div class="flex flex-col gap-4">
        <ContestDataTab :contest="contest" />
        <ContestDataCard :contest-key="contest.key" :is-ended="contest.phase === 'ended'" />
      </div>
    </PageSection>
    <PageSection :title="$t(`${KEY}.copy`)">
      <ContestCloneCard :contest="contest" />
    </PageSection>
    <PageSection :title="$t(`${KEY}.danger`)">
      <ContestDeleteCard :contest="contest" />
    </PageSection>
  </div>
</template>
