<script setup lang="ts">
import type { EditableContest } from '@/api/types/contest-editing';
import ContestToolRejudge from './ContestToolRejudge.vue';
import ContestToolSimilarity from './ContestToolSimilarity.vue';
import ContestToolSubmissions from './ContestToolSubmissions.vue';

/**
 * "Khi kỳ thi diễn ra": what a teacher uses while a contest runs, together and each once. The contest's submissions
 * with bulk actions, the one rejudge form, and similarity. Announcements have their own section above. The workbench
 * mounts this only once its fold was opened, so a closed fold asks the server nothing.
 */
defineProps<{ contest: EditableContest }>();
</script>

<template>
  <div class="flex flex-col gap-8" data-testid="contest-tools">
    <ContestToolSubmissions :contest="contest" />
    <ContestToolRejudge :contest="contest" />
    <ContestToolSimilarity :contest="contest" />
  </div>
</template>
