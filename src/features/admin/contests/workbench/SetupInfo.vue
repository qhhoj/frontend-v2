<script setup lang="ts">
import FormField from '@/components/ui/FormField.vue';
import TextInput from '@/components/ui/TextInput.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import type { ContestForm } from '../contest-form';
import ContestInfoSection from '../general/ContestInfoSection.vue';
import ContestOperationsSection from '../general/ContestOperationsSection.vue';
import ContestPeopleSection from '../general/ContestPeopleSection.vue';

/**
 * The last setup section: what the contest is called and how it is presented (summary, description, tags, images), who
 * runs it (authors, curators, testers), and its rules and balloons. Saved by the page's save bar.
 */
const form = defineModel<ContestForm>({ required: true });
defineProps<{ errors: FieldErrors }>();
</script>

<template>
  <div class="flex flex-col gap-4" data-testid="contest-info">
    <FormField
      scale="admin"
      input-id="contest-name"
      class="max-w-xl"
      :label="$t('admin.contests.general.fields.name')"
      :error="errors.name"
      required
    >
      <TextInput v-model="form.name" />
    </FormField>
    <ContestInfoSection v-model="form" :errors="errors" />
    <ContestPeopleSection v-model="form" />
    <ContestOperationsSection v-model="form" :errors="errors" />
  </div>
</template>
