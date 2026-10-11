<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Grader, ProblemData } from '@/api/types/problem-data';
import AdminStatus from '../../ui/AdminStatus.vue';
import AdminCheckbox from '../../ui/form/AdminCheckbox.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import { argsOf, setGrader, withArg } from './checker-config';
import ChoiceCards from '../../ui/form/ChoiceCards.vue';
import DataSourceRow from './DataSourceRow.vue';
import SourceCheckStatus from './SourceCheckStatus.vue';
import type { DataForm } from './test-cases';

/**
 * How the submission runs, in the Advanced view: plain, with an interactor, as functions linked to the problem's grader, or
 * as submitted output only. The files each mode needs are uploaded in place; a plain problem's input/output method is in
 * the Basic view (`IoMethodPicker`).
 */
const form = defineModel<DataForm>({ required: true });
defineProps<{ code: string; data: ProblemData }>();
const { t } = useI18n();
const key = 'admin.problems.data.config';
const GRADERS: Grader[] = ['standard', 'interactive', 'signature', 'output_only'];

const grader = computed<Grader>({
  get: () => form.value.grader,
  set: (next) => setGrader(form.value, next),
});
const graderOptions = computed(() =>
  GRADERS.map((value) => ({
    value,
    label: t(`${key}.grader.${value}.label`),
    description: t(`${key}.grader.${value}.description`),
  })),
);
const args = computed(() => argsOf(form.value.graderArgsText));
const setArg = (name: string, value: unknown) => {
  form.value.graderArgsText = withArg(form.value.graderArgsText, name, value);
};

const allowMain = computed({
  get: () => args.value.allow_main === true,
  set: (on: boolean) => setArg('allow_main', on ? true : undefined),
});
</script>

<template>
  <AdminFormSection
    id="data-grader-section"
    :title="t(`${key}.graderTitle`)"
    :description="t(`${key}.graderDescription`)"
    :columns="1"
  >
    <ChoiceCards
      v-model="grader"
      :legend="t(`${key}.graderLegend`)"
      name="data-grader"
      :options="graderOptions"
    />

    <ul
      v-if="grader === 'interactive' || grader === 'signature'"
      class="m-0 list-none divide-y divide-line rounded-cell border border-line p-0"
    >
      <DataSourceRow
        :code="code"
        kind="customGrader"
        :label="t(`${key}.${grader === 'interactive' ? 'interactorFile' : 'graderFile'}`)"
        :stored-name="data.customGrader"
      />
      <DataSourceRow
        v-if="grader === 'signature'"
        :code="code"
        kind="customHeader"
        :label="t(`${key}.headerFile`)"
        :stored-name="data.customHeader"
      />
    </ul>
    <SourceCheckStatus
      v-if="grader === 'interactive'"
      :check="data.sourceChecks.customGrader"
      :stored-name="data.customGrader"
    />
    <AdminStatus
      v-if="grader === 'interactive' && !data.customGrader"
      kind="queued"
      :text="t(`${key}.interactorMissing`)"
    />
    <AdminCheckbox
      v-if="grader === 'signature'"
      v-model="allowMain"
      input-id="data-allow-main"
      :label="t(`${key}.allowMain`)"
      :description="t(`${key}.allowMainHint`)"
    />
  </AdminFormSection>
</template>
