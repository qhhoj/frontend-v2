<script setup lang="ts">
import { computed } from 'vue';
import type { ExternalJudgeRun } from '@/api/types/external-judge';
import GlassCard from '@/components/GlassCard.vue';

/** The run on the remote OJ; the backend sends it only to viewers who may rejudge. */
const props = defineProps<{ run: ExternalJudgeRun }>();
const rows = computed(() =>
  [
    { key: 'oj', value: props.run.oj },
    { key: 'problem', value: props.run.problemId },
    { key: 'status', value: props.run.statusCanonical },
    { key: 'score', value: props.run.scoreText },
  ].filter((row) => row.value),
);
/** Only an http(s) address becomes a link: the value comes from a remote service. */
const link = computed(() =>
  props.run.remoteUrl?.match(/^https?:\/\//i) ? props.run.remoteUrl : null,
);
</script>

<template>
  <GlassCard class="rounded-panel p-4" data-testid="external-run">
    <h2 class="font-bold">{{ $t('submission.externalRun.title') }}</h2>
    <dl class="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
      <div v-for="row in rows" :key="row.key">
        <dt class="text-muted">{{ $t(`submission.externalRun.${row.key}`) }}</dt>
        <dd class="font-mono">{{ row.value }}</dd>
      </div>
      <div v-if="link">
        <dt class="text-muted">{{ $t('submission.externalRun.link') }}</dt>
        <dd>
          <a :href="link" target="_blank" rel="noopener noreferrer" class="text-accent underline">{{
            run.remoteId ?? $t('submission.externalRun.open')
          }}</a>
        </dd>
      </div>
    </dl>
  </GlassCard>
</template>
