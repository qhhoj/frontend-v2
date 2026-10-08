<script setup lang="ts">
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import AdminField from '../../ui/AdminField.vue';
import AdminSwitch from '../../ui/AdminSwitch.vue';
import { ADMIN_INPUT_CLASS } from '../../ui/classes';
import type { FieldErrors } from '../../ui/admin-errors';
import type { ContestForm } from '../contest-form';
import { nullableNumber, numberOrNaN, textOf } from './input-values';
import { usePermissionLocks } from './permission-locks';

const form = defineModel<ContestForm>({ required: true });
defineProps<{ errors: FieldErrors }>();
const { lockedBy, hintOf } = usePermissionLocks();
</script>

<template>
  <SettingsCard :title="$t('admin.contests.general.sections.time')">
    <div class="grid gap-5 sm:grid-cols-2">
      <AdminField
        input-id="contest-startTime"
        :label="$t('admin.contests.general.fields.start')"
        :error="errors.startTime"
      >
        <template #default="{ id, describedBy, invalid }">
          <input
            :id="id"
            v-model="form.startTime"
            type="datetime-local"
            :class="ADMIN_INPUT_CLASS"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
          />
        </template>
      </AdminField>
      <AdminField
        input-id="contest-endTime"
        :label="$t('admin.contests.general.fields.end')"
        :error="errors.endTime"
      >
        <template #default="{ id, describedBy, invalid }">
          <input
            :id="id"
            v-model="form.endTime"
            type="datetime-local"
            :class="ADMIN_INPUT_CLASS"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
          />
        </template>
      </AdminField>
      <AdminField
        input-id="contest-registrationStart"
        :label="$t('admin.contests.general.fields.registrationStart')"
      >
        <template #default="{ id, describedBy, invalid }">
          <input
            :id="id"
            v-model="form.registrationStart"
            type="datetime-local"
            :class="ADMIN_INPUT_CLASS"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
          />
        </template>
      </AdminField>
      <AdminField
        input-id="contest-registrationEnd"
        :label="$t('admin.contests.general.fields.registrationEnd')"
      >
        <template #default="{ id, describedBy, invalid }">
          <input
            :id="id"
            v-model="form.registrationEnd"
            type="datetime-local"
            :class="ADMIN_INPUT_CLASS"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
          />
        </template>
      </AdminField>
      <AdminField
        input-id="contest-lockedAfter"
        :label="$t('admin.contests.general.fields.lockedAfter')"
        :hint="hintOf('judge.lock_contest')"
      >
        <template #default="{ id, describedBy, invalid }">
          <input
            :id="id"
            v-model="form.lockedAfter"
            type="datetime-local"
            :disabled="Boolean(lockedBy('judge.lock_contest'))"
            :class="ADMIN_INPUT_CLASS"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
          />
        </template>
      </AdminField>
      <AdminField
        input-id="contest-timeLimit"
        :label="$t('admin.contests.general.fields.timeLimit')"
        :hint="$t('admin.contests.general.hints.timeLimit')"
      >
        <template #default="{ id, describedBy, invalid }">
          <input
            :id="id"
            :value="form.timeLimit ?? ''"
            type="number"
            min="1"
            inputmode="numeric"
            :class="ADMIN_INPUT_CLASS"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
            @input="form.timeLimit = nullableNumber(textOf($event))"
          />
        </template>
      </AdminField>
      <AdminField
        input-id="contest-frozenLastMinutes"
        :label="$t('admin.contests.general.fields.frozenLastMinutes')"
        :error="errors.frozenLastMinutes"
      >
        <template #default="{ id, describedBy, invalid }">
          <input
            :id="id"
            :value="form.frozenLastMinutes"
            type="number"
            min="0"
            :class="ADMIN_INPUT_CLASS"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
            @input="form.frozenLastMinutes = numberOrNaN(textOf($event))"
          />
        </template>
      </AdminField>
    </div>
    <AdminSwitch
      v-model="form.disallowVirtual"
      :label="$t('admin.contests.general.fields.disallowVirtual')"
      :description="$t('admin.contests.general.fields.disallowVirtualHint')"
    />
  </SettingsCard>
</template>
