<script setup lang="ts">
import { computed } from 'vue';
import { usePermissions } from '@/stores/use-permissions';
import AdminField from '../../ui/AdminField.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { INPUT } from '../../ui/controls';
import AdminCheckbox from '../../ui/form/AdminCheckbox.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import { EDIT_ALL_PROBLEM, lockNotice, permissionLock } from './field-lock';
import type { ProblemForm } from './problem-form';

const form = defineModel<ProblemForm>({ required: true });
defineProps<{ errors: FieldErrors; sectionId?: string }>();
const { can } = usePermissions();
const lockedBy = computed(() => permissionLock(can, EDIT_ALL_PROBLEM));
const isStaffLocked = computed(() => lockedBy.value !== undefined);

/** Each select: its form field, its options (the stored codes) and whether it is staff-only. */
const SELECTS = [
  { key: 'submissionSourceVisibility', i18n: 'source', options: ['F', 'A', 'S', 'O'] },
  { key: 'testcaseVisibility', i18n: 'testcases', options: ['O', 'C', 'A'] },
  { key: 'testcaseResultVisibility', i18n: 'results', options: ['A', 'B', 'S'], isStaff: true },
] as const;
</script>

<template>
  <AdminFormSection
    :id="sectionId"
    :title="$t('admin.problems.general.sections.visibility')"
    :description="$t('admin.problems.general.descriptions.visibility')"
    :columns="1"
  >
    <div class="grid gap-4 md:grid-cols-3">
      <AdminField
        v-for="select in SELECTS"
        :key="select.key"
        v-slot="{ id, describedBy, invalid }"
        :input-id="`problem-${select.key}`"
        :label="$t(`admin.problems.general.visibility.${select.i18n}`)"
        :hint="'isStaff' in select ? lockNotice(isStaffLocked) : undefined"
        :error="errors[select.key]"
      >
        <select
          :id="id"
          v-model="form[select.key]"
          :class="INPUT"
          :disabled="'isStaff' in select && isStaffLocked"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
        >
          <option v-for="option in select.options" :key="option" :value="option">
            {{ $t(`admin.problems.general.visibility.${select.i18n}${option}`) }}
          </option>
        </select>
      </AdminField>
    </div>
    <AdminCheckbox
      v-model="form.allowViewFeedback"
      input-id="problem-allowViewFeedback"
      :label="$t('admin.problems.general.visibility.feedback')"
      :description="$t('admin.problems.general.visibility.feedbackHint')"
      :locked-by="lockedBy"
    />
  </AdminFormSection>
</template>
