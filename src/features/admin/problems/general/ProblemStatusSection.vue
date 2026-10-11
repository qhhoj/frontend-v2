<script setup lang="ts">
import { usePermissions } from '@/stores/use-permissions';
import AdminField from '../../ui/AdminField.vue';
import { INPUT } from '../../ui/controls';
import AdminCheckbox from '../../ui/form/AdminCheckbox.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import { permissionLock } from './field-lock';
import type { ProblemForm } from './problem-form';

/** The Advanced view's status: manual management, full markup, and the revision comment ("Công khai" is in Basic). */
const form = defineModel<ProblemForm>({ required: true });
/** The revision comment of the next save (edit only). */
const changeMessage = defineModel<string>('changeMessage');
defineProps<{ sectionId?: string; hasChangeMessage?: boolean }>();
const { can } = usePermissions();
const lockFor = (permission: string) => permissionLock(can, permission);
</script>

<template>
  <AdminFormSection
    :id="sectionId"
    :title="$t('admin.problems.status.title')"
    :description="$t('admin.problems.general.descriptions.status')"
    :columns="1"
  >
    <AdminCheckbox
      v-model="form.isManuallyManaged"
      input-id="problem-isManuallyManaged"
      :label="$t('admin.problems.status.manual')"
      :locked-by="lockFor('judge.change_manually_managed')"
    />
    <AdminCheckbox
      v-model="form.isFullMarkup"
      input-id="problem-isFullMarkup"
      :label="$t('admin.problems.status.fullMarkup')"
      :description="$t('admin.problems.status.fullMarkupHint')"
      :locked-by="lockFor('judge.problem_full_markup')"
    />
    <AdminField
      v-if="hasChangeMessage"
      v-slot="{ id, describedBy }"
      class="max-w-xl"
      input-id="problem-changeMessage"
      :label="$t('admin.problems.general.changeMessage')"
      :hint="$t('admin.problems.general.changeMessagePlaceholder')"
    >
      <input
        :id="id"
        v-model="changeMessage"
        type="text"
        maxlength="500"
        :class="INPUT"
        :aria-describedby="describedBy"
      />
    </AdminField>
  </AdminFormSection>
</template>
