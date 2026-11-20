<script setup lang="ts">
import { computed } from 'vue';
import Lamp from '@/components/ui/Lamp.vue';
import VerdictChip from '@/components/ui/VerdictChip.vue';
import { formatCaseTime } from '@/lib/format';
import type { TrialResult, TrialResults } from './trial-results';

/**
 * What the model solution got on one test or one group, for the test table: the verdict (lamp and code) and the time.
 * A result older than the tests is in neutral ink and named as old; a test without a result says why in words.
 */
const props = defineProps<{
  result: TrialResult | undefined;
  phase: TrialResults['phase'];
  isStale: boolean;
}>();
const KEY = 'admin.problems.data.cases.trial';
const NO_RESULT = { none: 'none', running: 'waiting', finished: 'skipped' } as const;
const time = computed(() =>
  props.result && props.result.time !== null ? formatCaseTime(props.result.time) : '',
);
</script>

<template>
  <span
    v-if="result"
    class="inline-flex items-center gap-2 whitespace-nowrap"
    :data-stale="isStale || undefined"
    :title="isStale ? $t(`${KEY}.stale`) : undefined"
  >
    <span v-if="isStale" class="inline-flex items-center gap-2 text-muted">
      <Lamp tone="none" still />
      <span class="font-mono text-small font-bold">{{ result.verdict.code }}</span>
      <span class="sr-only">{{ $t(result.verdict.labelKey) }} · {{ $t(`${KEY}.stale`) }}</span>
    </span>
    <VerdictChip v-else :verdict="result.verdict" still />
    <span v-if="time" class="font-mono text-small text-muted tabular-nums">{{ time }}</span>
  </span>
  <span v-else class="text-meta whitespace-nowrap text-muted">{{
    $t(`${KEY}.${NO_RESULT[phase]}`)
  }}</span>
</template>
