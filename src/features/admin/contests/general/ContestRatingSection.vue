<script setup lang="ts">
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import AdminField from '../../ui/AdminField.vue';
import AdminSwitch from '../../ui/AdminSwitch.vue';
import UsernameChips from '../../ui/UsernameChips.vue';
import { ADMIN_INPUT_CLASS } from '../../ui/classes';
import type { ContestForm } from '../contest-form';
import { nullableNumber, textOf } from './input-values';
import { usePermissionLocks } from './permission-locks';

const form = defineModel<ContestForm>({ required: true });
const { lockedBy, hintOf } = usePermissionLocks();
</script>

<template>
  <SettingsCard :title="$t('admin.contests.general.sections.rating')">
    <AdminSwitch
      v-model="form.isRated"
      :label="$t('admin.contests.general.fields.isRated')"
      :locked-by="lockedBy('judge.contest_rating')"
    />
    <AdminSwitch
      v-model="form.rateAll"
      :label="$t('admin.contests.general.fields.rateAll')"
      :description="$t('admin.contests.general.fields.rateAllHint')"
      :locked-by="lockedBy('judge.contest_rating')"
    />
    <div class="grid gap-5 sm:grid-cols-2">
      <AdminField
        input-id="contest-ratingFloor"
        :label="$t('admin.contests.general.fields.ratingFloor')"
        :hint="hintOf('judge.contest_rating')"
      >
        <template #default="{ id, describedBy }">
          <input
            :id="id"
            :value="form.ratingFloor ?? ''"
            type="number"
            :disabled="Boolean(lockedBy('judge.contest_rating'))"
            :class="ADMIN_INPUT_CLASS"
            :aria-describedby="describedBy"
            @input="form.ratingFloor = nullableNumber(textOf($event))"
          />
        </template>
      </AdminField>
      <AdminField
        input-id="contest-ratingCeiling"
        :label="$t('admin.contests.general.fields.ratingCeiling')"
        :hint="hintOf('judge.contest_rating')"
      >
        <template #default="{ id, describedBy, invalid }">
          <input
            :id="id"
            :value="form.ratingCeiling ?? ''"
            type="number"
            :disabled="Boolean(lockedBy('judge.contest_rating'))"
            :class="ADMIN_INPUT_CLASS"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
            @input="form.ratingCeiling = nullableNumber(textOf($event))"
          />
        </template>
      </AdminField>
    </div>
    <UsernameChips
      v-model="form.rateExclude"
      :label="$t('admin.contests.general.fields.rateExclude')"
      :locked-by="lockedBy('judge.contest_rating')"
    />
  </SettingsCard>
</template>
