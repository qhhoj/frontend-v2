<script setup lang="ts">
import StateBit from '@/components/StateBit.vue';
import SubmissionList from './list/SubmissionList.vue';
import { GLOBAL_SCOPE } from './list/submission-scope';
</script>

<template>
  <div class="page-column">
    <div class="flex items-center justify-between gap-3">
      <h1 class="page-title">
        {{ $t('submissions.title') }}
      </h1>
      <StateBit variant="judging" size="inline" class="shrink-0" />
    </div>
    <SubmissionList :scope="GLOBAL_SCOPE" />
  </div>
</template>
