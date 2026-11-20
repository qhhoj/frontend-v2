<script setup lang="ts">
import type { EditableContest } from '@/api/types/contest-editing';
import PageSection from '@/components/ui/PageSection.vue';
import ContestToolRejudge from './ContestToolRejudge.vue';
import ContestToolSimilarity from './ContestToolSimilarity.vue';
import ContestToolSubmissions from './ContestToolSubmissions.vue';
import { CONTEST_TOOLS_ANCHORS } from '../workbench/contest-workbench-tabs';

/**
 * "Khi kỳ thi diễn ra": what a teacher uses while a contest runs, together and each once. The contest's submissions
 * with bulk actions, the one rejudge form, and similarity. Announcements have their own section above. The workbench
 * mounts this only once its fold was opened, so a closed fold asks the server nothing.
 */
defineProps<{ contest: EditableContest }>();
const KEY = 'admin.contests.workbench.tools';
</script>

<template>
  <div class="flex flex-col gap-8" data-testid="contest-tools">
    <PageSection :title="$t(`${KEY}.submissions.title`)">
      <ContestToolSubmissions :contest="contest" />
    </PageSection>
    <PageSection
      :id="CONTEST_TOOLS_ANCHORS.rejudge"
      class="scroll-mt-4"
      :title="$t(`${KEY}.rejudge.title`)"
    >
      <ContestToolRejudge :contest="contest" />
    </PageSection>
    <PageSection :title="$t(`${KEY}.similarity.title`)">
      <ContestToolSimilarity :contest="contest" />
    </PageSection>
  </div>
</template>
