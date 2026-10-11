<script setup lang="ts">
import { useId } from 'vue';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import { INPUT, buttonClass } from '../ui/controls';
import type { PairFilter, ProblemOption } from './similarity-pairs';

const props = defineProps<{
  filter: PairFilter;
  problems: ProblemOption[];
  languages: string[];
  /** The run's threshold in percent: no pair sits below it. */
  runMinPercent: number;
}>();
const emit = defineEmits<{ change: [filter: PairFilter]; reset: [] }>();

const problemInputId = useId();
const languageInputId = useId();
const minPercentInputId = useId();

const valueOf = (event: Event) => (event.target as HTMLInputElement | HTMLSelectElement).value;
/** Every change restarts the list at its first page. */
const changeTo = (patch: Partial<PairFilter>) =>
  emit('change', { ...props.filter, ...patch, page: 1 });

const onProblemChange = (event: Event) => changeTo({ problemId: valueOf(event) });
const onLanguageChange = (event: Event) => changeTo({ language: valueOf(event) });
const onMinPercentChange = (event: Event) => {
  const value = valueOf(event);
  changeTo({ minPercent: value === '' ? null : Number(value) });
};
</script>

<template>
  <SettingsCard :title="$t('admin.similarity.pairs.filters.heading')">
    <form class="grid gap-4 sm:grid-cols-3" @submit.prevent>
      <div class="flex flex-col gap-1.5">
        <label :for="problemInputId" class="text-sm font-semibold">
          {{ $t('admin.similarity.pairs.filters.problem') }}
        </label>
        <select
          :id="problemInputId"
          :value="filter.problemId"
          :class="INPUT"
          @change="onProblemChange"
        >
          <option value="">
            {{ $t('admin.similarity.pairs.filters.allProblems', { count: problems.length }) }}
          </option>
          <option v-for="problem in problems" :key="problem.id" :value="problem.id">
            {{ problem.code }}
          </option>
        </select>
      </div>
      <div class="flex flex-col gap-1.5">
        <label :for="languageInputId" class="text-sm font-semibold">
          {{ $t('admin.similarity.pairs.filters.language') }}
        </label>
        <select
          :id="languageInputId"
          :value="filter.language"
          :class="INPUT"
          @change="onLanguageChange"
        >
          <option value="">{{ $t('admin.similarity.pairs.filters.allLanguages') }}</option>
          <option v-for="language in languages" :key="language" :value="language">
            {{ language }}
          </option>
        </select>
      </div>
      <div class="flex flex-col gap-1.5">
        <label :for="minPercentInputId" class="text-sm font-semibold">
          {{ $t('admin.similarity.pairs.filters.minPercent') }}
        </label>
        <input
          :id="minPercentInputId"
          :value="filter.minPercent ?? ''"
          type="number"
          min="0"
          max="100"
          step="1"
          inputmode="numeric"
          :class="INPUT"
          :aria-describedby="`${minPercentInputId}-hint`"
          @change="onMinPercentChange"
        />
        <p :id="`${minPercentInputId}-hint`" class="text-xs text-muted">
          {{
            $t('admin.similarity.pairs.filters.minPercentHint', {
              fraction: filter.minPercent === null ? '' : filter.minPercent / 100,
              minPercent: runMinPercent,
            })
          }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3 sm:col-span-3">
        <button type="button" :class="buttonClass()" @click="emit('reset')">
          {{ $t('admin.similarity.pairs.filters.reset') }}
        </button>
        <p class="text-sm text-muted">{{ $t('admin.similarity.pairs.filters.hiddenNote') }}</p>
      </div>
    </form>
  </SettingsCard>
</template>
