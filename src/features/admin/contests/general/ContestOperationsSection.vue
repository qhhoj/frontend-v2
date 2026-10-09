<script setup lang="ts">
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import AdminField from '../../ui/AdminField.vue';
import AdminSwitch from '../../ui/AdminSwitch.vue';
import UsernameChips from '../../ui/UsernameChips.vue';
import { ADMIN_INPUT_CLASS } from '../../ui/classes';
import type { FieldErrors } from '../../ui/admin-errors';
import { RULES_MAX_LENGTH } from '../contest-form';
import type { ContestForm } from '../contest-form';

/** Contest rules and the balloon queue settings. */
const form = defineModel<ContestForm>({ required: true });
defineProps<{ errors: FieldErrors }>();
</script>

<template>
  <SettingsCard :title="$t('admin.contestRules.section')">
    <AdminField
      input-id="contest-rules"
      :label="$t('admin.contestRules.fields.rules')"
      :hint="$t('admin.contestRules.hints.rules')"
      :error="errors.rules"
    >
      <template #default="{ id, describedBy, invalid }">
        <textarea
          :id="id"
          v-model="form.rules"
          rows="8"
          :maxlength="RULES_MAX_LENGTH"
          :class="[ADMIN_INPUT_CLASS, 'font-mono text-sm']"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
        />
      </template>
    </AdminField>
    <AdminSwitch
      v-model="form.balloons"
      :label="$t('admin.contestRules.fields.balloons')"
      :description="$t('admin.contestRules.hints.balloons')"
    />
    <UsernameChips
      v-model="form.balloonStaff"
      data-testid="contest-balloon-staff"
      :label="$t('admin.contestRules.fields.balloonStaff')"
    />
    <p class="text-sm text-muted">{{ $t('admin.contestRules.hints.balloonStaff') }}</p>
  </SettingsCard>
</template>
