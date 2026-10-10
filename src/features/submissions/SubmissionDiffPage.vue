<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import StatePanel from '@/components/StatePanel.vue';
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
    <nav :aria-label="$t('common.breadcrumb')" class="flex items-center gap-2 text-sm">
      <RouterLink :to="{ name: 'submissions' }" class="text-muted hover:underline">{{
        $t('pages.submissions')
      }}</RouterLink>
      <span aria-hidden="true" class="text-muted">/</span>
      <span class="text-content">{{ $t('pages.submissionDiff') }}</span>
    </nav>
    <h1 class="page-title">
      {{ $t('pages.submissionDiff') }}
    </h1>
    <SubmissionDiffView v-if="pair" :key="pairKey" :pair="pair" />
    <StatePanel
      v-else
      :kind="DIFF_STATE_PANELS.pick"
      :title="$t('sourceDiff.pickTitle')"
      :body="$t('sourceDiff.pickBody')"
    >
      <RouterLink
        :to="{ name: 'submissions' }"
        class="inline-flex min-h-11 items-center rounded-pill bg-gradient-accent px-5 font-semibold text-on-accent"
        >{{ $t('sourceDiff.toList') }}</RouterLink
      >
    </StatePanel>
  </div>
</template>
