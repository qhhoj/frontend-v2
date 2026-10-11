<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { spanMessage } from '@/lib/contest-time';
import { buttonClass } from '../../ui/controls';
import AdminDateTimeField from '../../ui/form/AdminDateTimeField.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import type { ContestForm } from '../contest-form';
import { timeModel } from './input-values';

/** The Basic view's time: start and end, and quick lengths that set the end from the start. */
const form = defineModel<ContestForm>({ required: true });
defineProps<{ errors: FieldErrors }>();
const { t } = useI18n();
const KEY = 'admin.contests.general';
const QUICK_MINUTES = [15, 45, 90, 120] as const;

const start = timeModel(form, 'startTime');
const end = timeModel(form, 'endTime');

function lastFor(minutes: number) {
  const startMs = Date.parse(form.value.startTime);
  if (Number.isFinite(startMs))
    form.value.endTime = new Date(startMs + minutes * 60_000).toISOString();
}
/** "Kéo dài 45 phút." under the end, once the window reads. */
const lengthHint = computed(() => {
  const seconds = (Date.parse(form.value.endTime) - Date.parse(form.value.startTime)) / 1000;
  if (!(seconds > 0)) return undefined;
  const span = spanMessage(seconds);
  const text =
    span.count === undefined ? t(span.key, span.params) : t(span.key, span.params, span.count);
  return t(`${KEY}.hints.length`, { span: text });
});
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
