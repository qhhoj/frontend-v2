<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import FormField from '@/components/ui/FormField.vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import TextInput from '@/components/ui/TextInput.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { argsOf, usesFileIo, withArg } from './checker-config';
import type { DataForm } from './test-cases';

/**
 * How the student's program reads and writes: keyboard and screen (stdin/stdout) or named files (BAI.INP / BAI.OUT).
 * Only a plain problem reads input this way; another kind of problem says so.
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
const ioMethod = computed<IoMethod>(() => (usesFileIo(form.value) ? 'file' : 'standard'));
/** The method already shown changes nothing. Leaving files drops the two names with the method. */
function setIoMethod(next: IoMethod) {
  if (next === ioMethod.value) return;
  if (next === 'file') return setArg('io_method', 'file');
  let text = withArg(form.value.graderArgsText, 'io_method', undefined);
  text = withArg(text, 'io_input_file', undefined);
  form.value.graderArgsText = withArg(text, 'io_output_file', undefined);
}
const ioOptions = computed(() =>
  (['standard', 'file'] as const).map((value) => ({
    value,
    label: t(`${key}.io.${value}.label`),
    testid: `data-io-method-${value}`,
  })),
);
const fileName = (name: 'io_input_file' | 'io_output_file') =>
  typeof args.value[name] === 'string' ? args.value[name] : '';
</script>

<template>
  <div id="data-io-section" class="flex flex-col gap-3">
    <p class="m-0 text-meta text-muted">{{ t('admin.problems.workbench.tests.ioTitle') }}</p>
    <template v-if="form.grader === 'standard'">
      <SegmentedControl
        size="sm"
        :label="t('admin.problems.workbench.tests.ioTitle')"
        :options="ioOptions"
        :model-value="ioMethod"
        @update:model-value="setIoMethod"
      />
      <div v-if="ioMethod === 'file'" class="grid grid-cols-2 gap-3">
        <FormField
          v-for="name in ['io_input_file', 'io_output_file'] as const"
          :key="name"
          :input-id="`data-${name}`"
          :label="t(`${key}.${name}`)"
          :hint="t(`${key}.${name}Hint`)"
          :error="errors[`graderArgs.${name}`]"
          required
        >
          <TextInput
            :model-value="fileName(name)"
            class="font-mono"
            autocomplete="off"
            spellcheck="false"
            @input="setArg(name, ($event.target as HTMLInputElement).value.trim())"
          />
        </FormField>
      </div>
    </template>
    <p v-else class="m-0 text-meta text-muted" data-testid="data-io-other-grader">
      {{ t(`${key}.ioOtherGrader`, { grader: t(`${key}.grader.${form.grader}.label`) }) }}
    </p>
  </div>
</template>
