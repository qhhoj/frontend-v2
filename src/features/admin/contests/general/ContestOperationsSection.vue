<script setup lang="ts">
import AdminField from '../../ui/AdminField.vue';
import UsernameChips from '../../ui/UsernameChips.vue';
import { INPUT } from '../../ui/controls';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { RULES_MAX_LENGTH } from '../contest-form';
import type { ContestForm } from '../contest-form';
import ContestCheck from './ContestCheck.vue';

/** Contest rules and the balloon queue settings. */
const form = defineModel<ContestForm>({ required: true });
defineProps<{ errors: FieldErrors }>();
</script>

<template>
  <AdminFormSection
    id="contest-section-operations"
    :title="$t('admin.contestRules.section')"
    :description="$t('admin.contests.general.sectionLeads.operations')"
  >
    <AdminField
      class="lg:col-span-2"
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
          :class="[INPUT, 'py-2 font-mono text-sm']"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
        />
      </template>
    </AdminField>
    <ContestCheck
      v-model="form.balloons"
      input-id="contest-balloons"
      :label="$t('admin.contestRules.fields.balloons')"
      :description="$t('admin.contestRules.hints.balloons')"
    />
    <div class="flex flex-col gap-1.5">
      <UsernameChips
        v-model="form.balloonStaff"
        data-testid="contest-balloon-staff"
        :label="$t('admin.contestRules.fields.balloonStaff')"
      />
      <p class="text-xs text-muted">{{ $t('admin.contestRules.hints.balloonStaff') }}</p>
    </div>
  </AdminFormSection>
</template>
