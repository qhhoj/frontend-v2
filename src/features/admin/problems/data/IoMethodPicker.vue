<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminField from '../../ui/AdminField.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import ChoiceCards from '../../ui/form/ChoiceCards.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { INPUT } from '../../ui/controls';
import { argsOf, usesFileIo, withArg } from './checker-config';
import type { DataForm } from './test-cases';

/**
 * The Basic view's input/output: keyboard and screen (stdin/stdout) or named files (BAI.INP / BAI.OUT). Only a plain
 * problem reads input this way; another kind of problem says so and points to the Advanced view.
 */
const form = defineModel<DataForm>({ required: true });
defineProps<{ errors: FieldErrors }>();
const { t } = useI18n();
const key = 'admin.problems.data.config';
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
</script>

<template>
  <AdminFormSection id="data-io-section" :title="t(`${key}.graderTitle`)" :columns="1">
    <template v-if="form.grader === 'standard'">
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

    <p v-else class="text-sm text-muted" data-testid="data-io-other-grader">
      {{ t(`${key}.ioOtherGrader`, { grader: t(`${key}.grader.${form.grader}.label`) }) }}
    </p>
  </AdminFormSection>
</template>
