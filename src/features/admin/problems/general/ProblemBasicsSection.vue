<script setup lang="ts">
import { computed } from 'vue';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import { usePermissions } from '@/stores/use-permissions';
import AdminField from '../../ui/AdminField.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { ADMIN_INPUT_CLASS } from '../../ui/classes';
import { EDIT_ALL_PROBLEM, hintWhenLocked, lockNotice } from './field-lock';
import type { ProblemForm } from './problem-form';

const form = defineModel<ProblemForm>({ required: true });
defineProps<{ errors: FieldErrors }>();
const { can } = usePermissions();
/** Summary, preview image, date: staff-only on the backend, so a viewer without the permission sees them locked. */
const isStaffLocked = computed(() => !can(EDIT_ALL_PROBLEM));
</script>

<template>
  <SettingsCard :title="$t('admin.problems.general.sections.basics')">
    <div class="grid gap-5 sm:grid-cols-2">
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="problem-code"
        :label="$t('admin.problems.general.basics.code')"
        :hint="$t('admin.problems.general.basics.codeHint')"
        :error="errors.code"
      >
        <input
          :id="id"
          v-model="form.code"
          :class="ADMIN_INPUT_CLASS"
          autocomplete="off"
          :aria-describedby="describedBy"
          :aria-invalid="errors.code ? 'true' : undefined"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="problem-name"
        :label="$t('admin.problems.general.basics.name')"
        :hint="$t('admin.problems.general.basics.nameHint')"
        :error="errors.name"
      >
        <input
          :id="id"
          v-model="form.name"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="errors.name ? 'true' : undefined"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="problem-source"
        :label="$t('admin.problems.general.basics.source')"
        :error="errors.source"
      >
        <input
          :id="id"
          v-model="form.source"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="errors.source ? 'true' : undefined"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="problem-date"
        :label="$t('admin.problems.general.basics.date')"
        :hint="lockNotice(isStaffLocked)"
        :error="errors.date"
      >
        <input
          :id="id"
          v-model="form.date"
          type="datetime-local"
          :class="ADMIN_INPUT_CLASS"
          :disabled="isStaffLocked"
          :aria-describedby="describedBy"
          :aria-invalid="errors.date ? 'true' : undefined"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy }"
        class="sm:col-span-2"
        input-id="problem-summary"
        :label="$t('admin.problems.general.basics.summary')"
        :hint="hintWhenLocked($t('admin.problems.general.basics.summaryHint'), isStaffLocked)"
        :error="errors.summary"
      >
        <textarea
          :id="id"
          v-model="form.summary"
          rows="3"
          :class="ADMIN_INPUT_CLASS"
          :disabled="isStaffLocked"
          :aria-describedby="describedBy"
          :aria-invalid="errors.summary ? 'true' : undefined"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy }"
        class="sm:col-span-2"
        input-id="problem-ogImage"
        :label="$t('admin.problems.general.basics.ogImage')"
        :hint="hintWhenLocked($t('admin.problems.general.basics.ogImageHint'), isStaffLocked)"
        :error="errors.ogImage"
      >
        <input
          :id="id"
          v-model="form.ogImage"
          :class="ADMIN_INPUT_CLASS"
          :disabled="isStaffLocked"
          :aria-describedby="describedBy"
          :aria-invalid="errors.ogImage ? 'true' : undefined"
        />
      </AdminField>
    </div>
  </SettingsCard>
</template>
