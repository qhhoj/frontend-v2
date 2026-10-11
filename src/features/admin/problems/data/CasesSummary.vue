<script setup lang="ts">
import { computed } from 'vue';
import { ListChecks } from 'lucide-vue-next';
import { scoredCasePoints } from '../general/publish-readiness';
import { caseCount } from './test-cases';
import type { KeyedCase } from './test-cases';

/** The Basic view's line about the test list: how many tests and their total points; the rows are edited in Advanced. */
const props = defineProps<{ cases: KeyedCase[] }>();
const count = computed(() => caseCount(props.cases));
const points = computed(() => scoredCasePoints(props.cases));
</script>

<template>
  <div class="flex items-start gap-2 text-sm" data-testid="data-cases-summary">
    <ListChecks aria-hidden="true" class="mt-0.5 size-4 shrink-0 text-muted" :stroke-width="1.75" />
    <p class="m-0">
      <span class="font-semibold">{{
        count > 0
          ? $t('admin.problems.data.basic.summary', { count, points })
          : $t('admin.problems.data.basic.summaryEmpty')
      }}</span
      >{{ ' ' }}<span class="text-muted">{{ $t('admin.problems.data.basic.summaryMore') }}</span>
    </p>
  </div>
</template>
