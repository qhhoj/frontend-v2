<script setup lang="ts">
import StateBit from '@/components/StateBit.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import SubmissionList from './list/SubmissionList.vue';
import { GLOBAL_SCOPE } from './list/submission-scope';
</script>

<template>
  <div class="page-column">
    <PageHeader :title="$t('submissions.title')">
      <template #actions><StateBit variant="judging" size="inline" class="shrink-0" /></template>
    </PageHeader>
    <SubmissionList :scope="GLOBAL_SCOPE" />
  </div>
</template>
