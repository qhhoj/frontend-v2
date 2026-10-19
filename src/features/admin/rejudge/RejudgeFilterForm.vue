<script setup lang="ts">
import { STAFF_ICONS } from '@/features/admin/ui/staff-action-icons';
import { computed } from 'vue';
import type { Language } from '@/api/types/problems';
import { SUBMISSION_RESULT_CODES } from '@/api/types/submissions';
import AdminField from '../ui/AdminField.vue';
import AdminSwitch from '../ui/AdminSwitch.vue';
import VerdictChips from '../ui/VerdictChips.vue';
import AdminCheckChips from '../ui/AdminCheckChips.vue';
import { CARD, INPUT, buttonClass } from '../ui/controls';
import AdminDateTimeField from '../ui/form/AdminDateTimeField.vue';
import AdminNotice from '../ui/feedback/AdminNotice.vue';
import { needsPermissionText } from '../ui/permission-text';
import type { FieldErrors } from '../ui/admin-errors';
import { RESULT_PRESETS, isSiteWide } from './rejudge-filter';
import type { RejudgeFilter, ResultPreset } from './rejudge-filter';

const props = defineProps<{ languages: Language[]; errors: FieldErrors }>();
const filter = defineModel<RejudgeFilter>('filter', { required: true });
defineEmits<{ rejudge: []; rescore: []; reset: [] }>();

type TextField = 'problem' | 'contest' | 'user' | 'judgedOn';
type DateField = 'dateFrom' | 'dateTo';
const TEXT_PAIRS: [TextField, TextField][] = [
  ['problem', 'contest'],
  ['user', 'judgedOn'],
];
const DATE_FIELDS: DateField[] = ['dateFrom', 'dateTo'];
const PRESETS = Object.keys(RESULT_PRESETS) as ResultPreset[];
const languageOptions = computed(() =>
  props.languages.map((language) => ({ value: language.id, label: language.name })),
);
const siteWide = computed(() => isSiteWide(filter.value));
const applyPreset = (preset: ResultPreset) => {
  filter.value.results = [...RESULT_PRESETS[preset]];
};
</script>

<template>
  <section :class="[CARD, 'flex flex-col gap-5 p-5 sm:p-6']" aria-labelledby="rejudge-filter-title">
    <h2 id="rejudge-filter-title" class="section-title">
      {{ $t('admin.rejudge.filter.title') }}
    </h2>

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
          :class="INPUT"
          :aria-describedby="describedBy"
          :aria-invalid="errors[field] ? 'true' : undefined"
          autocomplete="off"
        />
      </AdminField>
    </div>
    <AdminNotice
      v-if="siteWide"
      tone="caution"
      :title="
        $t('admin.rejudge.filter.siteWide', {
          permission: needsPermissionText('judge.edit_all_problem'),
        })
      "
    />

    <div class="grid gap-4 sm:grid-cols-2">
      <AdminDateTimeField
        v-for="field in DATE_FIELDS"
        :key="field"
        v-model="filter[field]"
        :label="$t(`admin.rejudge.filter.${field}`)"
        :error="errors[field]"
        :input-id="`rejudge-${field}`"
      />
    </div>

    <fieldset class="flex flex-col gap-2">
      <legend class="text-sm font-semibold">{{ $t('admin.rejudge.filter.languages') }}</legend>
      <p class="text-xs text-muted">{{ $t('admin.rejudge.filter.languagesHint') }}</p>
      <p v-if="errors.languages" class="text-sm text-negative">{{ errors.languages }}</p>
      <AdminCheckChips
        v-model="filter.languageIds"
        :options="languageOptions"
        name="rejudge-language"
      />
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
          :class="buttonClass('secondary', 'sm')"
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

    <div class="flex flex-wrap justify-end gap-3 border-t border-line pt-4">
      <button type="button" :class="buttonClass('ghost')" @click="$emit('reset')">
        {{ $t('admin.rejudge.filter.reset') }}
      </button>
      <button type="button" :class="buttonClass('secondary')" @click="$emit('rescore')">
        {{ $t('admin.rejudge.filter.rescore') }}
      </button>
      <button type="button" :class="buttonClass('primary')" @click="$emit('rejudge')">
        <component :is="STAFF_ICONS.rejudge" class="size-4 shrink-0" aria-hidden="true" />
        {{ $t('admin.rejudge.filter.submit') }}
      </button>
    </div>
  </section>
</template>
