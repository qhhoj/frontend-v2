<script setup lang="ts">
import { computed } from 'vue';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import { usePermissions } from '@/stores/use-permissions';
import AdminField from '../../ui/AdminField.vue';
import AdminSwitch from '../../ui/AdminSwitch.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { ADMIN_INPUT_CLASS } from '../../ui/classes';
import { lockedByEditAll, lockNotice } from './field-lock';
import type { ProblemForm } from './problem-form';

const form = defineModel<ProblemForm>({ required: true });
defineProps<{ errors: FieldErrors }>();
const { can } = usePermissions();
const lockedBy = computed(() => lockedByEditAll(can));
const isStaffLocked = computed(() => lockedBy.value !== undefined);
</script>

<template>
  <SettingsCard :title="$t('admin.problems.general.sections.visibility')">
    <div class="grid gap-5 sm:grid-cols-3">
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="problem-submissionSourceVisibility"
        :label="$t('admin.problems.general.visibility.source')"
        :hint="$t('admin.problems.general.visibility.sourceHint')"
        :error="errors.submissionSourceVisibility"
      >
        <select
          :id="id"
          v-model="form.submissionSourceVisibility"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="errors.submissionSourceVisibility ? 'true' : undefined"
        >
          <option value="F">{{ $t('admin.problems.general.visibility.sourceF') }}</option>
          <option value="A">{{ $t('admin.problems.general.visibility.sourceA') }}</option>
          <option value="S">{{ $t('admin.problems.general.visibility.sourceS') }}</option>
          <option value="O">{{ $t('admin.problems.general.visibility.sourceO') }}</option>
        </select>
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="problem-testcaseVisibility"
        :label="$t('admin.problems.general.visibility.testcases')"
        :error="errors.testcaseVisibility"
      >
        <select
          :id="id"
          v-model="form.testcaseVisibility"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="errors.testcaseVisibility ? 'true' : undefined"
        >
          <option value="O">{{ $t('admin.problems.general.visibility.testcasesO') }}</option>
          <option value="C">{{ $t('admin.problems.general.visibility.testcasesC') }}</option>
          <option value="A">{{ $t('admin.problems.general.visibility.testcasesA') }}</option>
        </select>
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="problem-testcaseResultVisibility"
        :label="$t('admin.problems.general.visibility.results')"
        :hint="lockNotice(isStaffLocked)"
        :error="errors.testcaseResultVisibility"
      >
        <select
          :id="id"
          v-model="form.testcaseResultVisibility"
          :class="ADMIN_INPUT_CLASS"
          :disabled="isStaffLocked"
          :aria-describedby="describedBy"
          :aria-invalid="errors.testcaseResultVisibility ? 'true' : undefined"
        >
          <option value="A">{{ $t('admin.problems.general.visibility.resultsA') }}</option>
          <option value="B">{{ $t('admin.problems.general.visibility.resultsB') }}</option>
          <option value="S">{{ $t('admin.problems.general.visibility.resultsS') }}</option>
        </select>
      </AdminField>
    </div>
    <AdminSwitch
      v-model="form.allowViewFeedback"
      :label="$t('admin.problems.general.visibility.feedback')"
      :description="$t('admin.problems.general.visibility.feedbackHint')"
      :locked-by="lockedBy"
    />
  </SettingsCard>
</template>
