<script setup lang="ts">
import { computed } from 'vue';
import type { Checker, Grader } from '@/api/types/problem-data';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import AdminField from '../../ui/AdminField.vue';
import AdminSwitch from '../../ui/AdminSwitch.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { ADMIN_INPUT_CLASS } from '../../ui/classes';
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
  <SettingsCard :title="$t('admin.problems.data.checker.title')">
    <div class="grid gap-5 sm:grid-cols-2">
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="data-checker"
        :label="$t('admin.problems.data.checker.checkerLabel')"
      >
        <select
          :id="id"
          v-model="form.checker"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
        >
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
        <select
          :id="id"
          v-model="form.grader"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
        >
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
          :class="ADMIN_INPUT_CLASS"
          autocomplete="off"
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
          :class="ADMIN_INPUT_CLASS"
          autocomplete="off"
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
          :class="ADMIN_INPUT_CLASS"
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
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          @input="setOutputNumber('outputPrefix', ($event.target as HTMLInputElement).value)"
        />
      </AdminField>
    </div>
    <AdminSwitch v-model="form.unicode" :label="$t('admin.problems.data.checker.unicode')" />
    <AdminSwitch v-model="form.nobigmath" :label="$t('admin.problems.data.checker.nobigmath')" />
  </SettingsCard>
</template>
