<script setup lang="ts">
import { computed } from 'vue';
import { usePermissions } from '@/stores/use-permissions';
import AdminField from '../../ui/AdminField.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { INPUT } from '../../ui/controls';
import AdminDateTimeField from '../../ui/form/AdminDateTimeField.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import { EDIT_ALL_PROBLEM, hintWhenLocked, lockNotice } from './field-lock';
import type { ProblemForm } from './problem-form';

const form = defineModel<ProblemForm>({ required: true });
defineProps<{ errors: FieldErrors; sectionId?: string }>();
const { can } = usePermissions();
/** Summary, preview image, date: staff-only on the backend, so a viewer without the permission sees them locked. */
const isStaffLocked = computed(() => !can(EDIT_ALL_PROBLEM));
</script>

<template>
  <AdminFormSection
    :id="sectionId"
    :title="$t('admin.problems.general.sections.basics')"
    :description="$t('admin.problems.general.descriptions.basics')"
  >
    <AdminField
      v-slot="{ id, describedBy, invalid }"
      input-id="problem-source"
      :label="$t('admin.problems.general.basics.source')"
      :error="errors.source"
    >
      <input
        :id="id"
        v-model="form.source"
        :class="INPUT"
        :aria-describedby="describedBy"
        :aria-invalid="invalid === 'true'"
      />
    </AdminField>
    <AdminDateTimeField
      v-model="form.date"
      input-id="problem-date"
      :label="$t('admin.problems.general.basics.date')"
      :hint="lockNotice(isStaffLocked)"
      :error="errors.date"
      :disabled="isStaffLocked"
    />
    <AdminField
      v-slot="{ id, describedBy, invalid }"
      class="lg:col-span-2"
      input-id="problem-summary"
      :label="$t('admin.problems.general.basics.summary')"
      :hint="hintWhenLocked($t('admin.problems.general.basics.summaryHint'), isStaffLocked)"
      :error="errors.summary"
    >
      <textarea
        :id="id"
        v-model="form.summary"
        rows="2"
        :class="[INPUT, 'py-2']"
        :disabled="isStaffLocked"
        :aria-describedby="describedBy"
        :aria-invalid="invalid === 'true'"
      />
    </AdminField>
    <AdminField
      v-slot="{ id, describedBy, invalid }"
      class="lg:col-span-2"
      input-id="problem-ogImage"
      :label="$t('admin.problems.general.basics.ogImage')"
      :hint="hintWhenLocked($t('admin.problems.general.basics.ogImageHint'), isStaffLocked)"
      :error="errors.ogImage"
    >
      <input
        :id="id"
        v-model="form.ogImage"
        :class="INPUT"
        :disabled="isStaffLocked"
        :aria-describedby="describedBy"
        :aria-invalid="invalid === 'true'"
      />
    </AdminField>
  </AdminFormSection>
</template>
