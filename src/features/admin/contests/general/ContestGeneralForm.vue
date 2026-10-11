<script setup lang="ts">
import { CARD } from '../../ui/controls';
import type { FieldErrors } from '../../ui/admin-errors';
import type { ContestForm } from '../contest-form';
import ContestAccessSection from './ContestAccessSection.vue';
import ContestFormatSection from './ContestFormatSection.vue';
import ContestInfoSection from './ContestInfoSection.vue';
import ContestOperationsSection from './ContestOperationsSection.vue';
import ContestPeopleSection from './ContestPeopleSection.vue';
import ContestRatingSection from './ContestRatingSection.vue';
import ContestTimeSection from './ContestTimeSection.vue';
import SectionJumpSelect from './SectionJumpSelect.vue';

/**
 * Every section of the general tab in one card, split by hairlines; the create page and the tab share it. "Đi tới mục"
 * sits above the card, except from 1280 px when `hasRail` (the tab's side rail lists the sections instead).
 */
const form = defineModel<ContestForm>({ required: true });
defineProps<{
  errors: FieldErrors;
  isCreate: boolean;
  hasCodes: { access: boolean; ranking: boolean };
  hasRail?: boolean;
}>();
</script>

<template>
  <div class="flex min-w-0 flex-col gap-3">
    <SectionJumpSelect :class="hasRail && 'xl:hidden'" />
    <div :class="[CARD, 'flex min-w-0 flex-col']">
      <ContestInfoSection v-model="form" :errors="errors" :is-create="isCreate" />
      <ContestPeopleSection v-model="form" />
      <ContestTimeSection v-model="form" :errors="errors" />
      <ContestFormatSection v-model="form" :errors="errors" />
      <ContestAccessSection v-model="form" :errors="errors" :has-codes="hasCodes" />
      <ContestRatingSection v-model="form" :errors="errors" />
      <ContestOperationsSection v-model="form" :errors="errors" />
    </div>
  </div>
</template>
