<script setup lang="ts">
import { computed } from 'vue';
import type { CreationOwner } from '../../creation/creation-owners';
import { CARD } from '../../ui/controls';
import type { FieldErrors } from '../../ui/admin-errors';
import EditorViewTabs from '../../ui/form/EditorViewTabs.vue';
import type { EditorView } from '../../ui/form/editor-view';
import type { ContestForm } from '../contest-form';
import ContestAccessSection from './ContestAccessSection.vue';
import ContestBasicForm from './ContestBasicForm.vue';
import ContestFormatSection from './ContestFormatSection.vue';
import ContestInfoSection from './ContestInfoSection.vue';
import ContestOperationsSection from './ContestOperationsSection.vue';
import ContestPeopleSection from './ContestPeopleSection.vue';
import ContestRatingSection from './ContestRatingSection.vue';
import ContestTimeSection from './ContestTimeSection.vue';
import { contestAdvancedCount } from './contest-views';
import SectionJumpSelect from './SectionJumpSelect.vue';

/**
 * The general form in one card, as its Basic or Advanced view (`view`, kept in the URL by the parent); the create page and
 * the tab share it. In Advanced, "Đi tới mục" sits above the card, except from 1280 px when `hasRail` (the tab's side rail
 * lists the sections instead).
 */
const form = defineModel<ContestForm>({ required: true });
const props = defineProps<{
  errors: FieldErrors;
  isCreate: boolean;
  hasCodes: { access: boolean; ranking: boolean };
  view: EditorView;
  errorViews: readonly EditorView[];
  /** The last saved form (the empty form on create): the Advanced badge counts what differs from it. */
  saved: ContestForm;
  hasRail?: boolean;
  /** The organization a new contest is created in; it fixes the organization access fields. */
  owner?: CreationOwner | null;
}>();
const advancedCount = computed(() => contestAdvancedCount(form.value, props.saved));
</script>

<template>
  <div class="flex min-w-0 flex-col gap-3">
    <EditorViewTabs :view="view" :advanced-count="advancedCount" :error-views="errorViews" />
    <SectionJumpSelect v-if="view === 'advanced'" :class="hasRail && 'xl:hidden'" />
    <div :class="[CARD, 'flex min-w-0 flex-col']">
      <ContestBasicForm
        v-if="view === 'basic'"
        v-model="form"
        :errors="errors"
        :is-create="isCreate"
        :owner="owner"
      />
      <template v-else>
        <ContestInfoSection v-model="form" :errors="errors" />
        <ContestPeopleSection v-model="form" />
        <ContestTimeSection v-model="form" :errors="errors" />
        <ContestFormatSection v-model="form" :errors="errors" />
        <ContestAccessSection
          v-model="form"
          :errors="errors"
          :has-codes="hasCodes"
          :owner="owner"
        />
        <ContestRatingSection v-model="form" :errors="errors" />
        <ContestOperationsSection v-model="form" :errors="errors" />
      </template>
    </div>
  </div>
</template>
