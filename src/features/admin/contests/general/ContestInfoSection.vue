<script setup lang="ts">
import AdminField from '../../ui/AdminField.vue';
import { INPUT } from '../../ui/controls';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import type { ContestForm } from '../contest-form';
import TagChips from './TagChips.vue';

const form = defineModel<ContestForm>({ required: true });
const props = defineProps<{ errors: FieldErrors }>();
const IMAGE_FIELDS = ['ogImage', 'logoOverrideImage'] as const;
</script>

<template>
  <AdminFormSection
    id="contest-section-info"
    :title="$t('admin.contests.general.sections.info')"
    :description="$t('admin.contests.general.sectionLeads.info')"
  >
    <AdminField
      class="lg:col-span-2"
      input-id="contest-summary"
      :label="$t('admin.contests.general.fields.summary')"
      :error="props.errors.summary"
    >
      <template #default="{ id, describedBy, invalid }">
        <textarea
          :id="id"
          v-model="form.summary"
          rows="2"
          :class="[INPUT, 'py-2']"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
        />
      </template>
    </AdminField>
    <AdminField
      class="lg:col-span-2"
      input-id="contest-description"
      :label="$t('admin.contests.general.fields.description')"
      :error="props.errors.description"
    >
      <template #default="{ id, describedBy, invalid }">
        <textarea
          :id="id"
          v-model="form.description"
          rows="6"
          :class="[INPUT, 'py-2']"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
        />
      </template>
    </AdminField>
    <AdminField
      v-for="field in IMAGE_FIELDS"
      :key="field"
      :input-id="`contest-${field}`"
      :label="$t(`admin.contests.general.fields.${field}`)"
      :hint="$t(`admin.contests.general.hints.${field}`)"
      :error="props.errors[field]"
    >
      <template #default="{ id, describedBy, invalid }">
        <input
          :id="id"
          v-model.trim="form[field]"
          type="text"
          inputmode="url"
          maxlength="150"
          placeholder="https://… /media/…"
          :class="INPUT"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
          autocomplete="off"
          spellcheck="false"
        />
      </template>
    </AdminField>
    <TagChips
      v-model="form.tags"
      class="lg:col-span-2"
      :label="$t('admin.contests.general.fields.tags')"
      :placeholder="$t('admin.contests.general.tagPlaceholder')"
      :max="20"
      :error="props.errors.tags"
    />
  </AdminFormSection>
</template>
