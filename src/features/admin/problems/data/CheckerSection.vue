<script setup lang="ts">
import type { ProblemData } from '@/api/types/problem-data';
import AdminField from '../../ui/AdminField.vue';
import AdminCheckbox from '../../ui/form/AdminCheckbox.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { INPUT } from '../../ui/controls';
import type { EditorView } from '../../ui/form/editor-view';
import CheckerPicker from './CheckerPicker.vue';
import CheckerRuleOptions from './CheckerRuleOptions.vue';
import GraderPicker from './GraderPicker.vue';
import IoMethodPicker from './IoMethodPicker.vue';
import { numberBoxValue } from '../../ui/form/number-box';
import type { DataForm } from './test-cases';

/**
 * The judging settings above the test list. Basic: the checker type and the input/output method. Advanced: the checker's
 * rule and options, how the program runs, then the rarely used output options.
 */
const form = defineModel<DataForm>({ required: true });
defineProps<{ code: string; data: ProblemData; errors: FieldErrors; view: EditorView }>();
const key = 'admin.problems.data.config';

function setOutputNumber(field: 'outputLimit' | 'outputPrefix', event: Event) {
  form.value[field] = numberBoxValue(event);
}
</script>

<template>
  <template v-if="view === 'basic'">
    <CheckerPicker v-model="form" :code="code" :data="data" />
    <IoMethodPicker v-model="form" :errors="errors" />
  </template>
  <template v-else>
    <CheckerRuleOptions v-model="form" :errors="errors" />
    <GraderPicker v-model="form" :code="code" :data="data" />
    <AdminFormSection
      :title="$t(`${key}.advancedTitle`)"
      :description="$t(`${key}.advancedDescription`)"
    >
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="data-outputLimit"
        :label="$t('admin.problems.data.checker.outputLimit')"
        :hint="$t(`${key}.outputLimitHint`)"
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
