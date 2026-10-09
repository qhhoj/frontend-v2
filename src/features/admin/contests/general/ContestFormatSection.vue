<script setup lang="ts">
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import type { ContestFormatName, LabelStyle } from '@/api/types/contest-editing';
import AdminField from '../../ui/AdminField.vue';
import AdminSwitch from '../../ui/AdminSwitch.vue';
import { ADMIN_INPUT_CLASS } from '../../ui/classes';
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

/** Changing the format puts the new format's own defaults in its config (the backend refuses keys it does not know). */
function chooseFormat(event: Event) {
  const name = textOf(event) as ContestFormatName;
  form.value.formatName = name;
  form.value.formatConfig = { ...FORMAT_DEFAULTS[name] };
}
</script>

<template>
  <SettingsCard :title="$t('admin.contests.general.sections.format')">
    <div class="grid gap-5 sm:grid-cols-2">
      <AdminField
        input-id="contest-formatName"
        :label="$t('admin.contests.general.fields.formatName')"
      >
        <template #default="{ id, describedBy }">
          <select
            :id="id"
            :value="form.formatName"
            :class="ADMIN_INPUT_CLASS"
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
          <select
            :id="id"
            v-model="form.labelStyle"
            :class="ADMIN_INPUT_CLASS"
            :aria-describedby="describedBy"
          >
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
            :class="ADMIN_INPUT_CLASS"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
          />
        </template>
      </AdminField>
    </div>
    <fieldset class="flex flex-col gap-4 rounded-row border border-line p-4">
      <legend class="px-1 font-semibold">
        {{
          $t('admin.contests.general.fields.formatConfigTitle', {
            format: $t(`admin.contests.formats.${form.formatName}`),
          })
        }}
      </legend>
      <p class="text-sm text-muted">{{ $t('admin.contests.general.fields.formatConfigNote') }}</p>
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
              :class="ADMIN_INPUT_CLASS"
              :aria-describedby="describedBy"
              @input="form.formatConfig[field.name] = numberOrNaN(textOf($event))"
            />
          </template>
        </AdminField>
        <AdminSwitch
          v-else
          :model-value="Boolean(form.formatConfig[field.name])"
          :label="$t(field.labelKey)"
          @update:model-value="form.formatConfig[field.name] = $event"
        />
      </template>
    </fieldset>
    <AdminSwitch
      v-model="form.runPretestsOnly"
      :label="$t('admin.contests.general.fields.runPretestsOnly')"
    />
    <AdminSwitch
      v-model="form.hideProblemTags"
      :label="$t('admin.contests.general.fields.hideProblemTags')"
    />
    <AdminSwitch
      v-model="form.hideProblemAuthors"
      :label="$t('admin.contests.general.fields.hideProblemAuthors')"
    />
    <AdminSwitch
      v-model="form.showShortDisplay"
      :label="$t('admin.contests.general.fields.showShortDisplay')"
    />
    <AdminSwitch
      v-model="form.showSubmissionList"
      :label="$t('admin.contests.general.fields.showSubmissionList')"
      :description="$t('admin.contests.general.fields.showSubmissionListHint')"
    />
    <AdminSwitch
      v-model="form.pushAnnouncements"
      :label="$t('admin.contests.general.fields.pushLabel')"
      :description="$t('admin.contests.general.fields.pushHint')"
    />
  </SettingsCard>
</template>
