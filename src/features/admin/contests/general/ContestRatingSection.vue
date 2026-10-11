<script setup lang="ts">
import AdminField from '../../ui/AdminField.vue';
import UsernameChips from '../../ui/UsernameChips.vue';
import { INPUT } from '../../ui/controls';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import type { ContestForm } from '../contest-form';
import ContestCheck from './ContestCheck.vue';
import LockedFieldset from './LockedFieldset.vue';
import { nullableNumber, textOf } from './input-values';
import { usePermissionLocks } from './permission-locks';

/** Whether and for whom the contest counts towards rating. */
const form = defineModel<ContestForm>({ required: true });
defineProps<{ errors: FieldErrors }>();
const { lockedBy, hintOf } = usePermissionLocks();
const RATING = 'judge.contest_rating';
const BOUNDS = ['ratingFloor', 'ratingCeiling'] as const;
</script>

<template>
  <AdminFormSection
    id="contest-section-rating"
    :title="$t('admin.contests.general.sections.rating')"
    :description="$t('admin.contests.general.sectionLeads.rating')"
  >
    <ContestCheck
      v-model="form.isRated"
      input-id="contest-isRated"
      :label="$t('admin.contests.general.fields.isRated')"
      :locked-by="lockedBy(RATING)"
    />
    <ContestCheck
      v-model="form.rateAll"
      input-id="contest-rateAll"
      :label="$t('admin.contests.general.fields.rateAll')"
      :description="$t('admin.contests.general.fields.rateAllHint')"
      :locked-by="lockedBy(RATING)"
    />
    <AdminField
      v-for="bound in BOUNDS"
      :key="bound"
      :input-id="`contest-${bound}`"
      :label="$t(`admin.contests.general.fields.${bound}`)"
      :hint="hintOf(RATING)"
      :error="errors[bound]"
    >
      <template #default="{ id, describedBy, invalid }">
        <input
          :id="id"
          :value="form[bound] ?? ''"
          type="number"
          inputmode="numeric"
          :disabled="Boolean(lockedBy(RATING))"
          :class="[INPUT, 'font-mono tabular-nums']"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
          @input="form[bound] = nullableNumber(textOf($event))"
        />
      </template>
    </AdminField>
    <LockedFieldset class="lg:col-span-2" :locked-by="lockedBy(RATING)">
      <UsernameChips
        v-model="form.rateExclude"
        :label="$t('admin.contests.general.fields.rateExclude')"
      />
    </LockedFieldset>
  </AdminFormSection>
</template>
