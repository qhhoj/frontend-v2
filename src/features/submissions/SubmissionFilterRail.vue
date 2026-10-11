<script setup lang="ts">
import { TOOLBAR_INPUT_CLASS } from '@/components/toolbar-classes';
import { ChevronDown } from 'lucide-vue-next';
import Select from 'primevue/select';
import { computed } from 'vue';
import type { Language } from '@/api/types/problems';
import type { SubmissionResult } from '@/api/types/submissions';
import GlassCard from '@/components/GlassCard.vue';
import { translate } from '@/i18n';
import { useDebouncedText } from '@/lib/use-debounced-text';
import { MAX_PROBLEM_CODE_LENGTH, MAX_USERNAME_LENGTH } from './use-submission-filters';
import type { StatusGroup, SubmissionFilters } from './use-submission-filters';

/**
 * `showLive`, `showUser`, `showLanguage` and `showStatusGroups` let the contest rail and the list's advanced panel reuse
 * this rail without the controls they lack or show elsewhere. `layout="panel"` lays the same controls out across the
 * page's width (the submission list's "Bộ lọc nâng cao") instead of as a side rail.
 */
const props = withDefaults(
  defineProps<{
    filters: SubmissionFilters;
    languages: Language[];
    showLive?: boolean;
    showUser?: boolean;
    showLanguage?: boolean;
    showStatusGroups?: boolean;
    layout?: 'rail' | 'panel';
  }>(),
  { showLive: true, showUser: true, showLanguage: true, showStatusGroups: false, layout: 'rail' },
);
const isPanel = computed(() => props.layout === 'panel');
const emit = defineEmits<{ update: [patch: Partial<SubmissionFilters>]; reset: [] }>();

/** The mock-up's six; a URL may carry any other valid result, the table's empty state then names it. */
const RESULT_CHOICES: readonly SubmissionResult[] = ['AC', 'WA', 'TLE', 'MLE', 'RTE', 'CE'];
const STATUS_GROUPS: readonly StatusGroup[] = ['grading', 'final'];
const ANY_LANGUAGE = '';
const LANGUAGE_LABEL_ID = 'submission-language-label';
const TEXT_INPUT_CLASSES = `${TOOLBAR_INPUT_CLASS} w-full`;

const problemText = useDebouncedText(
  () => props.filters.problem,
  (problem) => emit('update', { problem }),
);
const userText = useDebouncedText(
  () => props.filters.user,
  (user) => emit('update', { user }),
);

const languageOptions = computed(() => [
  { id: ANY_LANGUAGE, name: translate('submissions.rail.anyLanguage') },
  ...props.languages,
]);
const toggleResult = (code: SubmissionResult, isChecked: boolean) =>
  emit('update', {
    results: isChecked
      ? [...props.filters.results, code]
      : props.filters.results.filter((selected) => selected !== code),
  });
const toggleStatusGroup = (group: StatusGroup, isChecked: boolean) =>
  emit('update', {
    statusGroups: isChecked
      ? [...props.filters.statusGroups, group]
      : props.filters.statusGroups.filter((selected) => selected !== group),
  });
const pickLanguage = (languageId: string) =>
  emit('update', { languageIds: languageId === ANY_LANGUAGE ? [] : [languageId] });
const checkedOf = (event: Event) => (event.target as HTMLInputElement).checked;
</script>

<template>
  <GlassCard
    :as="isPanel ? 'section' : 'aside'"
    :aria-label="$t(isPanel ? 'submissions.quick.advanced' : 'submissions.rail.title')"
    class="p-5"
    :class="
      isPanel
        ? 'grid gap-x-6 gap-y-4 md:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]'
        : 'flex flex-col gap-4 md:w-[280px] md:shrink-0'
    "
  >
    <div class="flex items-center justify-between" :class="{ 'md:col-span-2': isPanel }">
      <h2 class="font-display text-base font-bold">
        {{ $t(isPanel ? 'submissions.quick.advanced' : 'submissions.rail.title') }}
      </h2>
      <button
        type="button"
        data-testid="filters-reset"
        class="min-h-11 px-2 text-accent-text hover:underline"
        @click="emit('reset')"
      >
        {{ $t('submissions.rail.reset') }}
      </button>
    </div>
    <fieldset class="m-0 min-w-0 border-0 p-0" :class="{ 'md:row-span-3': isPanel }">
      <legend class="mb-1 text-[13px] text-muted">{{ $t('submissions.rail.results') }}</legend>
      <div class="grid grid-cols-2 gap-x-3" :class="isPanel ? 'sm:grid-cols-3' : 'md:grid-cols-1'">
        <label v-for="code in RESULT_CHOICES" :key="code" class="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            :value="code"
            :checked="filters.results.includes(code)"
            class="size-4 accent-accent"
            @change="toggleResult(code, checkedOf($event))"
          />
          <span class="w-8 font-mono text-[13px] font-bold">{{ code }}</span>
          <span class="text-[15px]">{{ $t(`verdicts.${code}`) }}</span>
        </label>
      </div>
    </fieldset>
    <fieldset v-if="showStatusGroups" class="m-0 flex min-w-0 flex-col gap-1 border-0 p-0">
      <legend class="mb-1 text-[13px] text-muted">
        {{ $t('contests.submissions.statusTitle') }}
      </legend>
      <label v-for="group in STATUS_GROUPS" :key="group" class="flex min-h-11 items-center gap-2.5">
        <input
          type="checkbox"
          class="size-4 accent-accent"
          :value="group"
          :checked="filters.statusGroups.includes(group)"
          @change="toggleStatusGroup(group, checkedOf($event))"
        />
        <span class="text-[15px]">{{ $t(`contests.submissions.status.${group}`) }}</span>
      </label>
    </fieldset>
    <div v-if="showLanguage" class="flex flex-col gap-1">
      <span :id="LANGUAGE_LABEL_ID" class="text-[13px] text-muted">{{
        $t('submissions.rail.language')
      }}</span>
      <Select
        :model-value="filters.languageIds[0] ?? null"
        :placeholder="$t('submissions.rail.anyLanguage')"
        :options="languageOptions"
        option-label="name"
        option-value="id"
        :aria-labelledby="LANGUAGE_LABEL_ID"
        class="h-11 w-full"
        @update:model-value="pickLanguage"
      >
        <template #dropdownicon><ChevronDown class="size-4" aria-hidden="true" /></template>
      </Select>
    </div>
    <label class="flex flex-col gap-1 text-[13px] text-muted">
      {{ $t('submissions.rail.problemLabel') }}
      <input
        v-model="problemText"
        name="problem"
        type="text"
        :maxlength="MAX_PROBLEM_CODE_LENGTH"
        autocomplete="off"
        :placeholder="$t('submissions.rail.problem')"
        :class="TEXT_INPUT_CLASSES"
      />
    </label>
    <label v-if="showUser" class="flex flex-col gap-1 text-[13px] text-muted">
      {{ $t('submissions.rail.userLabel') }}
      <input
        v-model="userText"
        name="user"
        type="text"
        :maxlength="MAX_USERNAME_LENGTH"
        autocomplete="off"
        :placeholder="$t('submissions.rail.user')"
        :class="TEXT_INPUT_CLASSES"
      />
    </label>
    <label v-if="showLive" class="flex min-h-11 items-center gap-2.5">
      <input
        type="checkbox"
        data-testid="live-toggle"
        :checked="filters.live"
        class="size-4 accent-accent"
        @change="emit('update', { live: checkedOf($event) })"
      />
      <span class="text-[15px]">{{ $t('submissions.rail.live') }}</span>
    </label>
  </GlassCard>
</template>
