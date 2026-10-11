<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ProblemData } from '@/api/types/problem-data';
import AdminStatus from '../../ui/AdminStatus.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import ChoiceCards from '../../ui/form/ChoiceCards.vue';
import { CUSTOM_KINDS, familyOf, setFamily } from './checker-config';
import type { CheckerFamily } from './checker-config';
import DataSourceRow from './DataSourceRow.vue';
import SourceCheckStatus from './SourceCheckStatus.vue';
import type { DataForm } from './test-cases';

/**
 * How an output is judged, in the Basic view: match the answer with a built-in rule (the default), or the teacher's own
 * checker (testlib, Themis or DMOJ exit codes) uploaded right here. The rule's options are in the Advanced view.
 */
const form = defineModel<DataForm>({ required: true });
defineProps<{ code: string; data: ProblemData }>();
const { t } = useI18n();
const key = 'admin.problems.data.config';

const family = computed<CheckerFamily>({
  get: () => familyOf(form.value),
  set: (next) => setFamily(form.value, next),
});
/** The built-in card is named after the rule in use: "So khớp đáp án" for the default `standard`. */
const isOtherRule = computed(() => family.value === 'stock' && form.value.checker !== 'standard');
const stockOption = computed(() => ({
  value: 'stock' as const,
  label: t(`${key}.stock.${family.value === 'stock' ? form.value.checker : 'standard'}.label`),
  description: t(`${key}.family.stock.${isOtherRule.value ? 'otherRule' : 'description'}`),
}));
const familyOptions = computed(() => [
  stockOption.value,
  ...CUSTOM_KINDS.map((value) => ({
    value,
    label: t(`${key}.family.${value}.label`),
    description: t(`${key}.family.${value}.description`),
  })),
]);
</script>

<template>
  <AdminFormSection
    id="data-checker-section"
    :title="t(`${key}.checkerTitle`)"
    :description="t(`${key}.checkerDescription`)"
    :columns="1"
  >
    <ChoiceCards
      v-model="family"
      :legend="t(`${key}.familyLegend`)"
      name="data-checker-family"
      :options="familyOptions"
    />
    <div v-if="family !== 'stock'" class="flex flex-col gap-4">
      <ul class="m-0 list-none rounded-cell border border-line p-0">
        <DataSourceRow
          :code="code"
          kind="customChecker"
          :label="t(`${key}.checkerFile`)"
          :stored-name="data.customChecker"
        />
      </ul>
      <SourceCheckStatus
        :check="data.sourceChecks.customChecker"
        :stored-name="data.customChecker"
      />
      <AdminStatus
        v-if="!data.customChecker"
        kind="queued"
        data-testid="checker-file-missing"
        :text="t(`${key}.checkerFileMissing`)"
      />
      <p v-if="family === 'themis'" class="text-sm text-muted" data-testid="themis-hint">
        {{ t(`${key}.themisHint`) }}
      </p>
    </div>
  </AdminFormSection>
</template>
