<script setup lang="ts">
import type { FieldErrors } from '../../ui/admin-errors';
import type { ContestForm } from '../contest-form';
import ContestAccessSection from './ContestAccessSection.vue';
import ContestFormatSection from './ContestFormatSection.vue';
import ContestInfoSection from './ContestInfoSection.vue';
import ContestRatingSection from './ContestRatingSection.vue';
import ContestTimeSection from './ContestTimeSection.vue';

/** Every section of the general tab, in the board's order; the create page and the tab share it. */
const form = defineModel<ContestForm>({ required: true });
defineProps<{
  errors: FieldErrors;
  isCreate: boolean;
  hasCodes: { access: boolean; ranking: boolean };
}>();
</script>

<template>
  <div class="flex flex-col gap-6">
    <ContestInfoSection v-model="form" :errors="errors" :is-create="isCreate" />
    <ContestTimeSection v-model="form" :errors="errors" />
    <ContestFormatSection v-model="form" :errors="errors" />
    <ContestAccessSection v-model="form" :errors="errors" :has-codes="hasCodes" />
    <ContestRatingSection v-model="form" />
  </div>
</template>
