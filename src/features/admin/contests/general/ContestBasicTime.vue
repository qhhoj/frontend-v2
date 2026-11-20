<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { buttonClass } from '../../ui/controls';
import AdminDateTimeField from '../../ui/form/AdminDateTimeField.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import type { ContestForm } from '../contest-form';
import { QUICK_MINUTES, useContestLength } from './contest-length';
import { timeModel } from './input-values';

/** The Basic view's time: start and end, and quick lengths that set the end from the start. */
const form = defineModel<ContestForm>({ required: true });
defineProps<{ errors: FieldErrors }>();
const { t } = useI18n();
const KEY = 'admin.contests.general';

const start = timeModel(form, 'startTime');
const end = timeModel(form, 'endTime');
const { lastFor, lengthHint } = useContestLength(form);
</script>

<template>
  <AdminFormSection
    :title="t(`${KEY}.basic.sections.time`)"
    :description="t(`${KEY}.basic.leads.time`)"
  >
    <AdminDateTimeField
      v-model="start"
      input-id="contest-startTime"
      :label="t(`${KEY}.fields.start`)"
      :error="errors.startTime"
      required
    />
    <AdminDateTimeField
      v-model="end"
      input-id="contest-endTime"
      :label="t(`${KEY}.fields.end`)"
      :error="errors.endTime"
      :hint="lengthHint"
      required
    />
    <div
      class="flex flex-wrap items-center gap-2 lg:col-span-2"
      role="group"
      :aria-label="t(`${KEY}.basic.quickHint`)"
    >
      <span class="text-sm font-semibold">{{ t(`${KEY}.basic.quickLegend`) }}</span>
      <button
        v-for="minutes in QUICK_MINUTES"
        :key="minutes"
        type="button"
        :data-testid="`contest-quick-${minutes}`"
        :disabled="!form.startTime"
        :class="buttonClass('secondary', 'sm')"
        @click="lastFor(minutes)"
      >
        {{ t(`${KEY}.basic.quick`, { n: minutes }) }}
      </button>
    </div>
  </AdminFormSection>
</template>
