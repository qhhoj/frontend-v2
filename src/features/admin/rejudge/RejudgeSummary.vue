<script setup lang="ts">
import { computed } from 'vue';
import type { Language } from '@/api/types/problems';
import AdminStatus from '../ui/AdminStatus.vue';
import type { RejudgeFilter } from './rejudge-filter';
import { describeRejudgeFilter } from './rejudge-filter';
import type { RejudgeOutcome } from './use-bulk-rejudge';

const props = defineProps<{
  filter: RejudgeFilter;
  languages: Language[];
  outcome: RejudgeOutcome | null;
}>();
const text = computed(() => describeRejudgeFilter(props.filter, props.languages));
const rows = computed(() => [
  { key: 'problem', label: 'admin.rejudge.summary.problem', value: text.value.problem },
  { key: 'from', label: 'admin.rejudge.summary.from', value: text.value.from },
  { key: 'to', label: 'admin.rejudge.summary.to', value: text.value.to },
  { key: 'languages', label: 'admin.rejudge.summary.languages', value: text.value.languages },
  { key: 'results', label: 'admin.rejudge.summary.results', value: text.value.results },
  { key: 'locked', label: 'admin.rejudge.summary.locked', value: text.value.locked },
]);
</script>

<template>
  <div class="flex flex-col gap-5">
    <section
      class="glass flex flex-col gap-4 rounded-panel p-5 sm:p-6"
      aria-labelledby="rejudge-summary-title"
    >
      <h2 id="rejudge-summary-title" class="font-display text-xl font-semibold">
        {{ $t('admin.rejudge.summary.title') }}
      </h2>
      <dl class="grid gap-3 text-sm sm:grid-cols-[max-content_1fr]">
        <template v-for="row in rows" :key="row.key">
          <dt class="text-muted">{{ $t(row.label) }}</dt>
          <dd class="min-w-0 break-words font-medium">{{ row.value }}</dd>
        </template>
      </dl>
      <p class="text-sm text-muted">{{ $t('admin.rejudge.summary.countNote') }}</p>
    </section>

    <section v-if="outcome" class="flex flex-col gap-3" aria-labelledby="rejudge-outcome-title">
      <h2 id="rejudge-outcome-title" class="font-display text-base font-bold">
        {{ $t('admin.rejudge.summary.lastResult') }}
      </h2>
      <AdminStatus :kind="outcome.kind" :text="outcome.text" :data-placement="outcome.kind" />
    </section>
  </div>
</template>
