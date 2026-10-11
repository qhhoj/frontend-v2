<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { FieldErrors } from '../../ui/admin-errors';
import type { ContestForm } from '../contest-form';
import ContestAccessSection from './ContestAccessSection.vue';
import ContestFormatSection from './ContestFormatSection.vue';
import ContestInfoSection from './ContestInfoSection.vue';
import ContestOperationsSection from './ContestOperationsSection.vue';
import ContestRatingSection from './ContestRatingSection.vue';
import ContestTimeSection from './ContestTimeSection.vue';
import SectionJumpList from './SectionJumpList.vue';

/** Every section of the general tab, in the board's order; the create page and the tab share it. */
const form = defineModel<ContestForm>({ required: true });
defineProps<{
  errors: FieldErrors;
  isCreate: boolean;
  hasCodes: { access: boolean; ranking: boolean };
}>();
const { t } = useI18n();
const SECTION_KEYS = ['info', 'time', 'format', 'access', 'rating', 'operations'] as const;
const sectionId = (key: string) => `contest-section-${key}`;
const sections = computed(() =>
  SECTION_KEYS.map((key) => ({
    id: sectionId(key),
    label: t(
      key === 'operations'
        ? 'admin.contestRules.section'
        : `admin.contests.general.sections.${key}`,
    ),
  })),
);
</script>

<template>
  <div class="flex flex-col gap-6">
    <SectionJumpList :sections="sections" :label="$t('admin.contests.general.jumpLabel')" />
    <div :id="sectionId('info')" class="scroll-mt-20">
      <ContestInfoSection v-model="form" :errors="errors" :is-create="isCreate" />
    </div>
    <div :id="sectionId('time')" class="scroll-mt-20">
      <ContestTimeSection v-model="form" :errors="errors" />
    </div>
    <div :id="sectionId('format')" class="scroll-mt-20">
      <ContestFormatSection v-model="form" :errors="errors" />
    </div>
    <div :id="sectionId('access')" class="scroll-mt-20">
      <ContestAccessSection v-model="form" :errors="errors" :has-codes="hasCodes" />
    </div>
    <div :id="sectionId('rating')" class="scroll-mt-20">
      <ContestRatingSection v-model="form" />
    </div>
    <div :id="sectionId('operations')" class="scroll-mt-20">
      <ContestOperationsSection v-model="form" :errors="errors" />
    </div>
  </div>
</template>
