<script setup lang="ts">
import { computed } from 'vue';
import type { Checker, Grader } from '@/api/types/problem-data';
import AdminField from '../../ui/AdminField.vue';
import AdminCheckbox from '../../ui/form/AdminCheckbox.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { INPUT } from '../../ui/controls';
import { optionalNumber } from './test-cases';
import type { DataForm } from './test-cases';

const form = defineModel<DataForm>({ required: true });
const props = defineProps<{ errors: FieldErrors; hasCustomChecker: boolean }>();

const STANDARD_CHECKERS: Checker[] = [
  'standard',
  'floats',
  'floatsabs',
  'floatsrel',
  'identical',
  'linecount',
];
const GRADERS: Grader[] = ['standard', 'interactive', 'signature', 'output_only'];
/** The problem's own checker is offered only when one was uploaded (the backend refuses it otherwise). */
const checkerOptions = computed<Checker[]>(() =>
  props.hasCustomChecker ? ['bridged', ...STANDARD_CHECKERS] : STANDARD_CHECKERS,
);

function setOutputNumber(field: 'outputLimit' | 'outputPrefix', text: string) {
  form.value[field] = optionalNumber(text);
}
</script>

<template>
  <AdminFormSection :title="$t('admin.problems.data.checker.title')" :columns="1">
    <div class="grid gap-4 md:grid-cols-2">
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="data-checker"
        :label="$t('admin.problems.data.checker.checkerLabel')"
      >
        <select :id="id" v-model="form.checker" :class="INPUT" :aria-describedby="describedBy">
          <option v-for="option in checkerOptions" :key="option" :value="option">
            {{ $t(`admin.problems.data.checkers.${option}`) }}
          </option>
        </select>
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="data-grader"
        :label="$t('admin.problems.data.checker.graderLabel')"
      >
        <select :id="id" v-model="form.grader" :class="INPUT" :aria-describedby="describedBy">
          <option v-for="option in GRADERS" :key="option" :value="option">
            {{ $t(`admin.problems.data.graders.${option}`) }}
          </option>
        </select>
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="data-checkerArgs"
        :label="$t('admin.problems.data.checker.checkerArgs')"
        :hint="$t('admin.problems.data.checker.jsonHint')"
        :error="errors.checkerArgs"
      >
        <input
          :id="id"
          v-model="form.checkerArgsText"
          :class="INPUT"
          autocomplete="off"
          spellcheck="false"
          class="font-mono"
          :aria-describedby="describedBy"
          :aria-invalid="errors.checkerArgs ? 'true' : undefined"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="data-graderArgs"
        :label="$t('admin.problems.data.checker.graderArgs')"
        :hint="$t('admin.problems.data.checker.jsonHint')"
        :error="errors.graderArgs"
      >
        <input
          :id="id"
          v-model="form.graderArgsText"
          :class="INPUT"
          autocomplete="off"
          spellcheck="false"
          class="font-mono"
          :aria-describedby="describedBy"
          :aria-invalid="errors.graderArgs ? 'true' : undefined"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="data-outputLimit"
        :label="$t('admin.problems.data.checker.outputLimit')"
      >
        <input
          :id="id"
          :value="form.outputLimit ?? ''"
          type="number"
          min="0"
          :class="INPUT"
          :aria-describedby="describedBy"
          @input="setOutputNumber('outputLimit', ($event.target as HTMLInputElement).value)"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="data-outputPrefix"
        :label="$t('admin.problems.data.checker.outputPrefix')"
      >
        <input
          :id="id"
          :value="form.outputPrefix ?? ''"
          type="number"
          min="0"
          :class="INPUT"
          :aria-describedby="describedBy"
          @input="setOutputNumber('outputPrefix', ($event.target as HTMLInputElement).value)"
        />
      </AdminField>
    </div>
    <div class="flex flex-wrap gap-x-8 gap-y-3">
      <AdminCheckbox
        v-model="form.unicode"
        input-id="data-unicode"
        :label="$t('admin.problems.data.checker.unicode')"
      />
      <AdminCheckbox
        v-model="form.nobigmath"
        input-id="data-nobigmath"
        :label="$t('admin.problems.data.checker.nobigmath')"
      />
    </div>
  </AdminFormSection>
</template>
