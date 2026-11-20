<script setup lang="ts">
import type { ProblemData } from '@/api/types/problem-data';
import Checkbox from '@/components/ui/Checkbox.vue';
import FormField from '@/components/ui/FormField.vue';
import TextInput from '@/components/ui/TextInput.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { numberBoxValue } from '../../ui/form/number-box';
import CheckerPicker from './CheckerPicker.vue';
import CheckerRuleOptions from './CheckerRuleOptions.vue';
import GraderPicker from './GraderPicker.vue';
import IoMethodPicker from './IoMethodPicker.vue';
import type { DataForm } from './test-cases';

/**
 * The judging settings of the workbench, without headings of their own (the panel names them). `main`: how a result is
 * compared, with the checker or interactor file, and the input/output method. `more`: what the student hands in, the
 * built-in rule's options and the rarely used output options.
 */
const form = defineModel<DataForm>({ required: true });
defineProps<{
  code: string;
  data: ProblemData;
  errors: FieldErrors;
  part: 'main' | 'more';
}>();
const key = 'admin.problems.data.config';
</script>

<template>
  <template v-if="part === 'main'">
    <CheckerPicker v-model="form" :code="code" :data="data" />
    <IoMethodPicker v-model="form" :errors="errors" />
  </template>
  <div v-else class="flex flex-col gap-4 pb-3">
    <GraderPicker v-model="form" :code="code" :data="data" />
    <CheckerRuleOptions v-model="form" :errors="errors" />
    <FormField
      v-for="field in ['outputLimit', 'outputPrefix'] as const"
      :key="field"
      :input-id="`data-${field}`"
      :label="$t(`admin.problems.data.checker.${field}`)"
      :hint="$t(`${key}.${field}Hint`)"
      :error="errors[field]"
    >
      <TextInput
        :model-value="form[field] ?? ''"
        type="number"
        inputmode="numeric"
        min="0"
        @input="form[field] = numberBoxValue($event)"
      />
    </FormField>
    <Checkbox
      v-model="form.unicode"
      input-id="data-unicode"
      :label="$t('admin.problems.data.checker.unicode')"
      :description="$t(`${key}.unicodeHint`)"
    />
    <Checkbox
      v-model="form.nobigmath"
      input-id="data-nobigmath"
      :label="$t('admin.problems.data.checker.nobigmath')"
      :description="$t(`${key}.nobigmathHint`)"
    />
  </div>
</template>
