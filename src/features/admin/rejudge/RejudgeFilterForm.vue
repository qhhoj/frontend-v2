<script setup lang="ts">
import { computed } from 'vue';
import type { Language } from '@/api/types/problems';
import { SUBMISSION_RESULT_CODES } from '@/api/types/submissions';
import AdminField from '../ui/AdminField.vue';
import AdminSwitch from '../ui/AdminSwitch.vue';
import VerdictChips from '../ui/VerdictChips.vue';
import {
  ADMIN_BUTTON_CLASS,
  ADMIN_CHECK_CHIP_CLASS,
  ADMIN_DANGER_CLASS,
  ADMIN_INPUT_CLASS,
} from '../ui/classes';
import type { FieldErrors } from '../ui/admin-errors';
import { RESULT_PRESETS, isSiteWide } from './rejudge-filter';
import type { RejudgeFilter, ResultPreset } from './rejudge-filter';

defineProps<{ languages: Language[]; errors: FieldErrors }>();
const filter = defineModel<RejudgeFilter>('filter', { required: true });
defineEmits<{ rejudge: []; rescore: []; reset: [] }>();

type TextField = 'problem' | 'contest' | 'user' | 'judgedOn' | 'idFrom' | 'idTo';
type DateField = 'dateFrom' | 'dateTo';
const TEXT_PAIRS: [TextField, TextField][] = [
  ['problem', 'contest'],
  ['user', 'judgedOn'],
];
const DATE_FIELDS: DateField[] = ['dateFrom', 'dateTo'];
const ID_FIELDS: TextField[] = ['idFrom', 'idTo'];
const PRESETS = Object.keys(RESULT_PRESETS) as ResultPreset[];
const siteWide = computed(() => isSiteWide(filter.value));
const applyPreset = (preset: ResultPreset) => {
  filter.value.results = [...RESULT_PRESETS[preset]];
};
</script>

<template>
  <section
    class="glass flex flex-col gap-5 rounded-panel p-5 sm:p-6"
    aria-labelledby="rejudge-filter-title"
  >
    <header class="flex flex-wrap items-center gap-3">
      <h2 id="rejudge-filter-title" class="font-display text-xl font-semibold">
        {{ $t('admin.rejudge.filter.title') }}
      </h2>
      <span class="rounded-pill border border-line px-2.5 py-0.5 font-mono text-xs">
        judge.rejudge_submission
      </span>
    </header>

    <div v-for="pair in TEXT_PAIRS" :key="pair[0]" class="grid gap-4 sm:grid-cols-2">
      <AdminField
        v-for="field in pair"
        :key="field"
        v-slot="{ id, describedBy }"
        :label="$t(`admin.rejudge.filter.${field}`)"
        :hint="$t(`admin.rejudge.filter.${field}Hint`)"
        :error="errors[field]"
        :input-id="`rejudge-${field}`"
      >
        <input
          :id="id"
          v-model="filter[field]"
          type="text"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="errors[field] ? 'true' : undefined"
          autocomplete="off"
        />
      </AdminField>
    </div>
    <p v-if="siteWide" class="rounded-row border border-line bg-surface-hover p-3 text-sm">
      {{ $t('admin.rejudge.filter.siteWide') }}
    </p>

    <div class="grid gap-4 sm:grid-cols-2">
      <AdminField
        v-for="field in DATE_FIELDS"
        :key="field"
        v-slot="{ id, describedBy }"
        :label="$t(`admin.rejudge.filter.${field}`)"
        :error="errors[field]"
        :input-id="`rejudge-${field}`"
      >
        <input
          :id="id"
          v-model="filter[field]"
          type="datetime-local"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="errors[field] ? 'true' : undefined"
        />
      </AdminField>
    </div>

    <details class="rounded-row border border-line p-3" :open="!!(filter.idFrom || filter.idTo)">
      <summary class="cursor-pointer text-sm font-semibold">
        {{ $t('admin.rejudge.filter.idRange') }}
      </summary>
      <p class="mt-2 text-xs text-muted">{{ $t('admin.rejudge.filter.idHint') }}</p>
      <div class="mt-3 grid gap-4 sm:grid-cols-2">
        <AdminField
          v-for="field in ID_FIELDS"
          :key="field"
          v-slot="{ id, describedBy }"
          :label="$t(`admin.rejudge.filter.${field}`)"
          :error="errors[field]"
          :input-id="`rejudge-${field}`"
        >
          <input
            :id="id"
            v-model="filter[field]"
            type="text"
            :class="`${ADMIN_INPUT_CLASS} font-mono text-sm`"
            :aria-describedby="describedBy"
            :aria-invalid="errors[field] ? 'true' : undefined"
            autocomplete="off"
          />
        </AdminField>
      </div>
    </details>

    <fieldset class="flex flex-col gap-2">
      <legend class="text-sm font-semibold">{{ $t('admin.rejudge.filter.languages') }}</legend>
      <p class="text-xs text-muted">{{ $t('admin.rejudge.filter.languagesHint') }}</p>
      <p v-if="errors.languages" class="text-sm text-negative">{{ errors.languages }}</p>
      <div class="flex flex-wrap gap-2">
        <label v-for="language in languages" :key="language.id" :class="ADMIN_CHECK_CHIP_CLASS">
          <input
            v-model="filter.languageIds"
            type="checkbox"
            name="rejudge-language"
            :value="language.id"
          />
          {{ language.name }}
        </label>
      </div>
    </fieldset>

    <fieldset class="flex flex-col gap-2">
      <legend class="text-sm font-semibold">{{ $t('admin.rejudge.filter.results') }}</legend>
      <p class="text-xs text-muted">{{ $t('admin.rejudge.filter.resultsHint') }}</p>
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <span class="text-muted">{{ $t('admin.rejudge.filter.presets') }}</span>
        <button
          v-for="preset in PRESETS"
          :key="preset"
          type="button"
          class="min-h-11 rounded-pill border border-line-strong px-3 font-semibold hover:bg-surface-hover"
          @click="applyPreset(preset)"
        >
          {{ $t(`admin.rejudge.presets.${preset}`) }}
        </button>
      </div>
      <VerdictChips
        v-model="filter.results"
        :codes="SUBMISSION_RESULT_CODES"
        name="rejudge-result"
      />
    </fieldset>

    <AdminSwitch
      v-model="filter.force"
      :label="$t('admin.rejudge.filter.force')"
      :description="$t('admin.rejudge.filter.forceHint')"
    />
    <p class="text-sm text-muted">{{ $t('admin.rejudge.filter.lockedNote') }}</p>

    <div class="flex flex-wrap gap-3">
      <button type="button" :class="ADMIN_BUTTON_CLASS" @click="$emit('reset')">
        {{ $t('admin.rejudge.filter.reset') }}
      </button>
      <button type="button" :class="ADMIN_BUTTON_CLASS" @click="$emit('rescore')">
        {{ $t('admin.rejudge.filter.rescore') }}
      </button>
      <button type="button" :class="ADMIN_DANGER_CLASS" @click="$emit('rejudge')">
        {{ $t('admin.rejudge.filter.submit') }}
      </button>
    </div>
  </section>
</template>
