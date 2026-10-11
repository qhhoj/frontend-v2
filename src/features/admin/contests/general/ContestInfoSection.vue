<script setup lang="ts">
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import AdminField from '../../ui/AdminField.vue';
import { ADMIN_INPUT_CLASS } from '../../ui/classes';
import type { FieldErrors } from '../../ui/admin-errors';
import UsernameChips from '../../ui/UsernameChips.vue';
import type { ContestForm } from '../contest-form';
import TagChips from './TagChips.vue';

const form = defineModel<ContestForm>({ required: true });
const props = defineProps<{ errors: FieldErrors; isCreate: boolean }>();
const IMAGE_FIELDS = ['ogImage', 'logoOverrideImage'] as const;
</script>

<template>
  <SettingsCard :title="$t('admin.contests.general.sections.info')">
    <AdminField
      input-id="contest-key"
      :label="$t('admin.contests.general.fields.key')"
      :hint="isCreate ? $t('admin.contests.general.hints.key') : undefined"
      :error="props.errors.key"
    >
      <template #default="{ id, describedBy, invalid }">
        <input
          :id="id"
          v-model="form.key"
          :readonly="!isCreate"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
          autocomplete="off"
        />
      </template>
    </AdminField>
    <AdminField
      input-id="contest-name"
      :label="$t('admin.contests.general.fields.name')"
      :error="props.errors.name"
    >
      <template #default="{ id, describedBy, invalid }">
        <input
          :id="id"
          v-model="form.name"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
        />
      </template>
    </AdminField>
    <AdminField
      input-id="contest-summary"
      :label="$t('admin.contests.general.fields.summary')"
      :error="props.errors.summary"
    >
      <template #default="{ id, describedBy, invalid }">
        <textarea
          :id="id"
          v-model="form.summary"
          rows="2"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
        />
      </template>
    </AdminField>
    <AdminField
      input-id="contest-description"
      :label="$t('admin.contests.general.fields.description')"
      :error="props.errors.description"
    >
      <template #default="{ id, describedBy, invalid }">
        <textarea
          :id="id"
          v-model="form.description"
          rows="6"
          :class="ADMIN_INPUT_CLASS"
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
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
          autocomplete="off"
          spellcheck="false"
        />
      </template>
    </AdminField>
    <TagChips
      v-model="form.tags"
      :label="$t('admin.contests.general.fields.tags')"
      :placeholder="$t('admin.contests.general.tagPlaceholder')"
      :max="20"
      :error="props.errors.tags"
    />
    <UsernameChips v-model="form.authors" :label="$t('admin.contests.general.fields.authors')" />
    <UsernameChips
      v-model="form.curators"
      data-testid="contest-curators"
      :label="$t('admin.contests.general.fields.curators')"
    />
    <UsernameChips v-model="form.testers" :label="$t('admin.contests.general.fields.testers')" />
  </SettingsCard>
</template>
