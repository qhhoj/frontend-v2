<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import StatePanel from '@/components/StatePanel.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { DIFF_STATE_PANELS } from './diff-bits';
import { diffPairOf } from './diff-picks';
import SubmissionDiffView from './SubmissionDiffView.vue';

const route = useRoute();
const pair = computed(() => diffPairOf(route.query));
/** A new pair is a new page: the view and its queries start over. */
const pairKey = computed(() => (pair.value ? `${pair.value.left}|${pair.value.right}` : ''));
</script>

<template>
  <div class="page-column">
    <PageHeader
      :title="$t('pages.submissionDiff')"
      :crumbs="[
        { label: $t('pages.submissions'), to: { name: 'submissions' } },
        { label: $t('pages.submissionDiff') },
      ]"
      :back="{ to: { name: 'submissions' }, label: $t('pages.submissions') }"
    />
    <SubmissionDiffView v-if="pair" :key="pairKey" :pair="pair" />
    <StatePanel
      v-else
      :kind="DIFF_STATE_PANELS.pick"
      :title="$t('sourceDiff.pickTitle')"
      :body="$t('sourceDiff.pickBody')"
    >
      <AppButton tone="primary" :to="{ name: 'submissions' }">{{
        $t('sourceDiff.toList')
      }}</AppButton>
    </StatePanel>
  </div>
</template>
