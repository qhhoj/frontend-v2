<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue';
import SubmissionList from './list/SubmissionList.vue';
import { GLOBAL_SCOPE } from './list/submission-scope';
import { useMineByDefault } from './list/use-mine-by-default';

const { isDeciding } = useMineByDefault();
</script>

<template>
  <div class="page-column">
    <PageHeader :title="$t('submissions.title')" />
    <SubmissionList :scope="GLOBAL_SCOPE" :enabled="!isDeciding" />
  </div>
</template>
