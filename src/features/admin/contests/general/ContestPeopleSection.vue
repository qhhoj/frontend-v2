<script setup lang="ts">
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import UsernameChips from '../../ui/UsernameChips.vue';
import type { ContestForm } from '../contest-form';

/** Who edits, reviews and tests the contest. */
const form = defineModel<ContestForm>({ required: true });
</script>

<template>
  <AdminFormSection
    id="contest-section-people"
    :title="$t('admin.contests.general.sections.people')"
    :description="$t('admin.contests.general.sectionLeads.people')"
  >
    <UsernameChips v-model="form.authors" :label="$t('admin.contests.general.fields.authors')" />
    <UsernameChips
      v-model="form.curators"
      data-testid="contest-curators"
      :label="$t('admin.contests.general.fields.curators')"
    />
    <UsernameChips v-model="form.testers" :label="$t('admin.contests.general.fields.testers')" />
  </AdminFormSection>
</template>
