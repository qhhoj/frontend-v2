<script setup lang="ts">
import { usePermissions } from '@/stores/use-permissions';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import AdminSwitch from '../../ui/AdminSwitch.vue';
import { permissionLock } from './field-lock';
import type { ProblemForm } from './problem-form';

const form = defineModel<ProblemForm>({ required: true });
const { can } = usePermissions();
const lockFor = (permission: string) => permissionLock(can, permission);
</script>

<template>
  <SettingsCard :title="$t('admin.problems.status.title')">
    <div class="flex flex-col gap-5">
      <AdminSwitch
        v-model="form.isPublic"
        :label="$t('admin.problems.status.public')"
        :locked-by="lockFor('judge.change_public_visibility')"
      />
      <AdminSwitch
        v-model="form.isManuallyManaged"
        :label="$t('admin.problems.status.manual')"
        :locked-by="lockFor('judge.change_manually_managed')"
      />
      <AdminSwitch
        v-model="form.isFullMarkup"
        :label="$t('admin.problems.status.fullMarkup')"
        :description="$t('admin.problems.status.fullMarkupHint')"
        :locked-by="lockFor('judge.problem_full_markup')"
      />
    </div>
  </SettingsCard>
</template>
