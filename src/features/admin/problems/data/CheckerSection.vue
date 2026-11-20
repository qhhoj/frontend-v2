<script setup lang="ts">
import type { ProblemData } from '@/api/types/problem-data';
import AdminField from '../../ui/AdminField.vue';
import AdminCheckbox from '../../ui/form/AdminCheckbox.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { INPUT } from '../../ui/controls';
import CheckerPicker from './CheckerPicker.vue';
import CheckerRuleOptions from './CheckerRuleOptions.vue';
import GraderPicker from './GraderPicker.vue';
import IoMethodPicker from './IoMethodPicker.vue';
import { numberBoxValue } from '../../ui/form/number-box';
import type { DataForm } from './test-cases';

/**
 * The judging settings of the workbench. `main`: how the answer is compared (with the checker file), how the program runs
 * (interactor, header and grader files) and the input/output method. `advanced`: the checker's rule options and the rarely
 * used output options.
 */
const form = defineModel<DataForm>({ required: true });
defineProps<{
  code: string;
  data: ProblemData;
  errors: FieldErrors;
  part: 'main' | 'advanced';
}>();
const key = 'admin.problems.data.config';

function setOutputNumber(field: 'outputLimit' | 'outputPrefix', event: Event) {
  form.value[field] = numberBoxValue(event);
}
</script>

<template>
  <template v-if="part === 'main'">
    <CheckerPicker v-model="form" :code="code" :data="data" />
    <GraderPicker v-model="form" :code="code" :data="data" />
    <IoMethodPicker v-model="form" :errors="errors" />
  </template>
  <template v-else>
    <CheckerRuleOptions v-model="form" :errors="errors" />
    <AdminFormSection
      :title="$t(`${key}.advancedTitle`)"
      :description="$t(`${key}.advancedDescription`)"
    >
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="data-outputLimit"
        :label="$t('admin.problems.data.checker.outputLimit')"
        :hint="$t(`${key}.outputLimitHint`)"
        :error="errors.outputLimit"
      >
        <input
          :id="id"
          :value="form.outputLimit ?? ''"
          type="number"
          inputmode="numeric"
          min="0"
          :class="INPUT"
          :aria-describedby="describedBy"
          @input="setOutputNumber('outputLimit', $event)"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="data-outputPrefix"
        :label="$t('admin.problems.data.checker.outputPrefix')"
        :hint="$t(`${key}.outputPrefixHint`)"
        :error="errors.outputPrefix"
      >
        <input
          :id="id"
          :value="form.outputPrefix ?? ''"
          type="number"
          inputmode="numeric"
          min="0"
          :class="INPUT"
          :aria-describedby="describedBy"
          @input="setOutputNumber('outputPrefix', $event)"
        />
      </AdminField>
      <AdminCheckbox
        v-model="form.unicode"
        input-id="data-unicode"
        :label="$t('admin.problems.data.checker.unicode')"
        :description="$t(`${key}.unicodeHint`)"
      />
      <AdminCheckbox
        v-model="form.nobigmath"
        input-id="data-nobigmath"
        :label="$t('admin.problems.data.checker.nobigmath')"
        :description="$t(`${key}.nobigmathHint`)"
      />
    </AdminFormSection>
  </template>
</template>
