<script setup lang="ts">
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import type { ProblemEditingMeta } from '@/api/types/problem-editing';
import AdminField from '../../ui/AdminField.vue';
import AdminSwitch from '../../ui/AdminSwitch.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { ADMIN_INPUT_CLASS } from '../../ui/classes';
import LanguageLimitsTable from './LanguageLimitsTable.vue';
import type { ProblemForm } from './problem-form';

const form = defineModel<ProblemForm>({ required: true });
defineProps<{ meta: ProblemEditingMeta; errors: FieldErrors }>();
</script>

<template>
  <SettingsCard :title="$t('admin.problems.general.sections.limits')">
    <div class="grid gap-5 sm:grid-cols-3">
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="problem-timeLimit"
        :label="$t('admin.problems.general.limits.timeLimit')"
        :hint="$t('admin.problems.general.limits.timeLimitHint')"
        :error="errors.timeLimit"
      >
        <input
          :id="id"
          v-model.number="form.timeLimit"
          type="number"
          step="0.01"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="errors.timeLimit ? 'true' : undefined"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="problem-memoryLimit"
        :label="$t('admin.problems.general.limits.memoryLimit')"
        :hint="$t('admin.problems.general.limits.memoryLimitHint')"
        :error="errors.memoryLimit"
      >
        <input
          :id="id"
          v-model.number="form.memoryLimit"
          type="number"
          step="1"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="errors.memoryLimit ? 'true' : undefined"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy }"
        input-id="problem-points"
        :label="$t('admin.problems.general.limits.points')"
        :hint="$t('admin.problems.general.limits.pointsHint')"
        :error="errors.points"
      >
        <input
          :id="id"
          v-model.number="form.points"
          type="number"
          step="1"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="errors.points ? 'true' : undefined"
        />
      </AdminField>
    </div>
    <AdminSwitch
      v-model="form.partial"
      :label="$t('admin.problems.general.limits.partial')"
      :description="$t('admin.problems.general.limits.partialHint')"
    />
    <LanguageLimitsTable
      v-model="form.languageLimits"
      :languages="meta.languages"
      :errors="errors"
      :default-time-limit="form.timeLimit"
      :default-memory-limit="form.memoryLimit"
    />
  </SettingsCard>
</template>
