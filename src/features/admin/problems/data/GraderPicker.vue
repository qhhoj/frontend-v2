<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Grader, ProblemData } from '@/api/types/problem-data';
import AdminField from '../../ui/AdminField.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import AdminCheckbox from '../../ui/form/AdminCheckbox.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { INPUT } from '../../ui/controls';
import { argsOf, setGrader, usesFileIo, withArg } from './checker-config';
import ChoiceCards from './ChoiceCards.vue';
import DataSourceRow from './DataSourceRow.vue';
import SourceCheckStatus from './SourceCheckStatus.vue';
import type { DataForm } from './test-cases';

/**
 * How the submission runs: plain (stdin/stdout or named files), with an interactor, as functions linked to the problem's
 * grader, or as submitted output only. The files each mode needs are uploaded in place.
 */
const form = defineModel<DataForm>({ required: true });
defineProps<{ code: string; data: ProblemData; errors: FieldErrors }>();
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

type IoMethod = 'standard' | 'file';
const ioMethod = computed<IoMethod>({
  get: () => (usesFileIo(form.value) ? 'file' : 'standard'),
  set: (next) => {
    if (next === 'file') return setArg('io_method', 'file');
    let text = withArg(form.value.graderArgsText, 'io_method', undefined);
    text = withArg(text, 'io_input_file', undefined);
    form.value.graderArgsText = withArg(text, 'io_output_file', undefined);
  },
});
const ioOptions = computed(() =>
  (['standard', 'file'] as IoMethod[]).map((value) => ({
    value,
    label: t(`${key}.io.${value}.label`),
    description: t(`${key}.io.${value}.description`),
  })),
);
const fileName = (name: 'io_input_file' | 'io_output_file') =>
  typeof args.value[name] === 'string' ? args.value[name] : '';
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

    <template v-if="grader === 'standard'">
      <ChoiceCards
        v-model="ioMethod"
        :legend="t(`${key}.ioLegend`)"
        name="data-io-method"
        :options="ioOptions"
      />
      <div v-if="ioMethod === 'file'" class="grid gap-4 md:grid-cols-2">
        <AdminField
          v-for="name in ['io_input_file', 'io_output_file'] as const"
          :key="name"
          v-slot="{ id, describedBy, invalid }"
          :input-id="`data-${name}`"
          :label="t(`${key}.${name}`)"
          :hint="t(`${key}.${name}Hint`)"
          :error="errors[`graderArgs.${name}`]"
          required
        >
          <input
            :id="id"
            :value="fileName(name)"
            :class="[INPUT, 'font-mono']"
            autocomplete="off"
            spellcheck="false"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
            @input="setArg(name, ($event.target as HTMLInputElement).value.trim())"
          />
        </AdminField>
      </div>
    </template>

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
