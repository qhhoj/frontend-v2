<script setup lang="ts">
import type { EditableContest } from '@/api/types/contest-editing';
import ContestExportCard from './ContestExportCard.vue';
import FeedKeyCard from './FeedKeyCard.vue';

defineProps<{ contest: EditableContest }>();
</script>

<template>
  <div class="grid items-start gap-5 lg:grid-cols-2">
    <ContestExportCard :contest="contest" />
    <FeedKeyCard :contest="contest" />
  </div>
</template>
