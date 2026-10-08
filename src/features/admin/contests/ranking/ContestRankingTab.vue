<script setup lang="ts">
import type { EditableContest } from '@/api/types/contest-editing';
import OfficialRankingCard from './OfficialRankingCard.vue';
import RankingLinkCard from './RankingLinkCard.vue';

/** The public link comes first on a phone; from `lg` the two cards sit side by side. */
const props = defineProps<{ contest: EditableContest }>();
</script>

<template>
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <RankingLinkCard :contest-key="props.contest.key" />
    <OfficialRankingCard :contest-key="props.contest.key" />
  </div>
</template>
