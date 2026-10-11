<script setup lang="ts">
import type { ContestFormatName, LabelStyle } from '@/api/types/contest-editing';
import AdminField from '../../ui/AdminField.vue';
import { INPUT } from '../../ui/controls';
import AdminCheckbox from '../../ui/form/AdminCheckbox.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { FORMAT_DEFAULTS, FORMAT_FIELDS } from '../format-config';
import type { ContestForm } from '../contest-form';
import { numberOrNaN, textOf } from './input-values';

const form = defineModel<ContestForm>({ required: true });
defineProps<{ errors: FieldErrors }>();
const FORMAT_NAMES: ContestFormatName[] = [
  'default',
  'icpc',
  'ioi',
  'ioi16',
  'vnoj',
  'final_submission',
  'ultimate',
];
const LABEL_STYLES: LabelStyle[] = ['alpha', 'numeric'];
/** The contest-wide switches, saved with the form: two columns of checkboxes. */
const OPTIONS = [
  { field: 'runPretestsOnly', hint: 'runPretestsOnlyHint' },
  { field: 'hideProblemTags', hint: 'hideProblemTagsHint' },
  { field: 'hideProblemAuthors', hint: undefined },
  { field: 'showShortDisplay', hint: undefined },
  { field: 'showSubmissionList', hint: 'showSubmissionListHint' },
  { field: 'pushAnnouncements', hint: 'pushHint' },
] as const;
const optionLabel = (field: string) => (field === 'pushAnnouncements' ? 'pushLabel' : field);

/** Changing the format puts the new format's own defaults in its config (the backend refuses keys it does not know). */
function chooseFormat(event: Event) {
  const name = textOf(event) as ContestFormatName;
  form.value.formatName = name;
  form.value.formatConfig = { ...FORMAT_DEFAULTS[name] };
}
</script>

<template>
  <AdminFormSection
    id="contest-section-format"
    :title="$t('admin.contests.general.sections.format')"
    :description="$t('admin.contests.general.fields.formatConfigNote')"
  >
    <div class="grid gap-4 sm:grid-cols-3 lg:col-span-2">
      <AdminField
        input-id="contest-formatName"
        :label="$t('admin.contests.general.fields.formatName')"
      >
        <template #default="{ id, describedBy }">
          <select
            :id="id"
            :value="form.formatName"
            :class="INPUT"
            :aria-describedby="describedBy"
            @change="chooseFormat"
          >
            <option v-for="name in FORMAT_NAMES" :key="name" :value="name">
              {{ $t(`admin.contests.formats.${name}`) }}
            </option>
          </select>
        </template>
      </AdminField>
      <AdminField
        input-id="contest-labelStyle"
        :label="$t('admin.contests.general.fields.labelStyle')"
      >
        <template #default="{ id, describedBy }">
          <select :id="id" v-model="form.labelStyle" :class="INPUT" :aria-describedby="describedBy">
            <option v-for="style in LABEL_STYLES" :key="style" :value="style">
              {{
                style === 'alpha'
                  ? $t('admin.contests.general.fields.labelAlpha')
                  : $t('admin.contests.general.fields.labelNumeric')
              }}
            </option>
          </select>
        </template>
      </AdminField>
      <AdminField
        input-id="contest-pointsPrecision"
        :label="$t('admin.contests.general.fields.pointsPrecision')"
        :hint="$t('admin.contests.general.hints.pointsPrecision')"
        :error="errors.pointsPrecision"
      >
        <template #default="{ id, describedBy, invalid }">
          <input
            :id="id"
            v-model.number="form.pointsPrecision"
            type="number"
            min="0"
            max="10"
            :class="[INPUT, 'font-mono tabular-nums']"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
          />
        </template>
      </AdminField>
    </div>
    <fieldset class="m-0 grid min-w-0 gap-4 border-0 p-0 lg:col-span-2 lg:grid-cols-2">
      <legend class="mb-3 text-sm font-semibold">
        {{
          $t('admin.contests.general.fields.formatConfigTitle', {
            format: $t(`admin.contests.formats.${form.formatName}`),
          })
        }}
      </legend>
      <p v-if="FORMAT_FIELDS[form.formatName].length === 0" class="text-sm text-muted">
        {{ $t('admin.contests.general.fields.formatNoOptions') }}
      </p>
      <template v-for="field in FORMAT_FIELDS[form.formatName]" :key="field.name">
        <AdminField
          v-if="field.kind === 'minutes'"
          :input-id="`contest-format-${field.name}`"
          :label="$t(field.labelKey)"
          :error="errors[`formatConfig.${field.name}`]"
        >
          <template #default="{ id, describedBy }">
            <input
              :id="id"
              :value="form.formatConfig[field.name]"
              type="number"
              min="0"
              :class="[INPUT, 'font-mono tabular-nums']"
              :aria-describedby="describedBy"
              @input="form.formatConfig[field.name] = numberOrNaN(textOf($event))"
            />
          </template>
        </AdminField>
        <AdminCheckbox
          v-else
          :model-value="Boolean(form.formatConfig[field.name])"
          :input-id="`contest-format-${field.name}`"
          :label="$t(field.labelKey)"
          @update:model-value="form.formatConfig[field.name] = $event"
        />
      </template>
    </fieldset>
    <fieldset class="m-0 grid min-w-0 gap-4 border-0 p-0 lg:col-span-2 lg:grid-cols-2">
      <legend class="mb-3 text-sm font-semibold">
        {{ $t('admin.contests.general.fields.optionsTitle') }}
      </legend>
      <AdminCheckbox
        v-for="option in OPTIONS"
        :key="option.field"
        v-model="form[option.field]"
        :input-id="`contest-${option.field}`"
        :label="$t(`admin.contests.general.fields.${optionLabel(option.field)}`)"
        :description="option.hint ? $t(`admin.contests.general.fields.${option.hint}`) : undefined"
      />
    </fieldset>
  </AdminFormSection>
</template>
