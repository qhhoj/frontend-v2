<script setup lang="ts">
import { computed } from 'vue';
import type { BulkBody, BulkProblemsResult } from '@/api/types/organization-problems';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import { ORG_BITS } from '../org-bits';
import { isFullSuccess, rowTextKey } from './bulk-outcome';

/** Board M7A's result card: one line per code and the n/m summary, announced once. */
const props = defineProps<{ result: BulkProblemsResult; action: BulkBody['action'] }>();
const total = computed(() => props.result.results.length);
const isFull = computed(() => isFullSuccess(props.result));
</script>

<template>
  <section
    data-testid="org-bulk-result"
    aria-labelledby="org-bulk-result-title"
    class="glass flex flex-col gap-3 rounded-card p-5"
  >
    <h2 id="org-bulk-result-title" class="font-display text-base font-bold">
      {{
        $t(
          'orgProblems.bulk.resultTitle',
          { action: $t(`orgProblems.bulk.actions.${action}`), count: total },
          total,
        )
      }}
    </h2>
    <ul class="flex flex-col gap-1 text-sm">
      <li
        v-for="row in result.results"
        :key="row.code"
        :class="row.outcome === 'done' ? '' : 'text-negative'"
      >
        <span aria-hidden="true">{{ row.outcome === 'done' ? '✓' : '✗' }}</span>
        {{ $t(rowTextKey(row), { code: row.code }) }}
      </li>
    </ul>
    <SettingsNotice
      role="status"
      :tone="isFull ? 'success' : 'warning'"
      :bit="isFull ? ORG_BITS.bulkDone : ORG_BITS.bulkPartial"
    >
      {{ $t('orgProblems.bulk.summary', { done: result.done, total }) }}
    </SettingsNotice>
  </section>
</template>
