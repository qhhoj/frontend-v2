<script setup lang="ts">
import { computed } from 'vue';
import type { Language } from '@/api/types/problems';
import AdminStatus from '../ui/AdminStatus.vue';
import { CARD } from '../ui/controls';
import QueuedProgress from './QueuedProgress.vue';
import type { RejudgeFilter } from './rejudge-filter';
import { describeRejudgeFilter } from './rejudge-filter';
import type { RejudgeOutcome } from './use-bulk-rejudge';

const props = defineProps<{
  filter: RejudgeFilter;
  languages: Language[];
  outcome: RejudgeOutcome | null;
}>();
const text = computed(() => describeRejudgeFilter(props.filter, props.languages));
const ROW_KEYS = [
  'scope',
  'user',
  'judge',
  'from',
  'to',
  'languages',
  'results',
  'locked',
] as const;
</script>

<template>
  <div class="flex flex-col gap-5">
    <section :class="[CARD, 'flex flex-col gap-4 p-5']" aria-labelledby="rejudge-summary-title">
      <h2 id="rejudge-summary-title" class="font-display text-base font-semibold">
        {{ $t('admin.rejudge.summary.title') }}
      </h2>
      <dl class="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
        <template v-for="key in ROW_KEYS" :key="key">
          <dt class="text-muted">{{ $t(`admin.rejudge.summary.${key}`) }}</dt>
          <dd class="min-w-0 font-medium break-words">{{ text[key] }}</dd>
        </template>
      </dl>
      <p class="text-sm text-muted">{{ $t('admin.rejudge.summary.countNote') }}</p>
    </section>

    <section v-if="outcome" class="flex flex-col gap-3" aria-labelledby="rejudge-outcome-title">
      <h2 id="rejudge-outcome-title" class="font-display text-base font-bold">
        {{ $t('admin.rejudge.summary.lastResult') }}
      </h2>
      <AdminStatus :kind="outcome.kind" :text="outcome.text" :data-placement="outcome.kind" />
      <QueuedProgress v-if="outcome.kind === 'done' && outcome.query" :query="outcome.query" />
    </section>
  </div>
</template>
