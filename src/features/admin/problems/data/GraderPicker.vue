<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Grader, ProblemData } from '@/api/types/problem-data';
import Checkbox from '@/components/ui/Checkbox.vue';
import FormField from '@/components/ui/FormField.vue';
import SelectField from '@/components/ui/SelectField.vue';
import { argsOf, setGrader, withArg } from './checker-config';
import DataSourceRow from './DataSourceRow.vue';
import type { DataForm } from './test-cases';

/**
 * What the student hands in, among the rarely used options: a whole program (the default), functions linked to the
 * problem's grader, or output files only. The files a kind needs are uploaded in place. An interactive problem is
 * chosen in the compare mode (`CheckerPicker`), so this choice is not offered while it is on.
 */
const form = defineModel<DataForm>({ required: true });
defineProps<{ code: string; data: ProblemData }>();
const { t } = useI18n();
const key = 'admin.problems.data.config';
const GRADERS: Grader[] = ['standard', 'signature', 'output_only'];

const grader = computed<Grader>({
  get: () => form.value.grader,
  set: (next) => setGrader(form.value, next),
});
const graderOptions = computed(() =>
  GRADERS.map((value) => ({ value, label: t(`${key}.grader.${value}.label`) })),
);
const allowMain = computed({
  get: () => argsOf(form.value.graderArgsText).allow_main === true,
  set: (on: boolean) => {
    form.value.graderArgsText = withArg(
      form.value.graderArgsText,
      'allow_main',
      on ? true : undefined,
    );
  },
});
</script>

<template>
  <div v-if="grader !== 'interactive'" id="data-grader-section" class="flex flex-col gap-3">
    <FormField
      input-id="data-grader"
      :label="t(`${key}.graderLegend`)"
      :hint="t(`${key}.grader.${grader}.description`)"
    >
      <SelectField v-model="grader" :options="graderOptions" />
    </FormField>
    <template v-if="grader === 'signature'">
      <ul class="m-0 list-none divide-y divide-line rounded-control border border-line p-0">
        <DataSourceRow
          :code="code"
          kind="customGrader"
          :label="t(`${key}.graderFile`)"
          :stored-name="data.customGrader"
        />
        <DataSourceRow
          :code="code"
          kind="customHeader"
          :label="t(`${key}.headerFile`)"
          :stored-name="data.customHeader"
        />
      </ul>
      <Checkbox
        v-model="allowMain"
        input-id="data-allow-main"
        :label="t(`${key}.allowMain`)"
        :description="t(`${key}.allowMainHint`)"
      />
    </template>
  </div>
</template>
