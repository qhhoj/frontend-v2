<script setup lang="ts">
import Checkbox from '@/components/ui/Checkbox.vue';
import DateTimeField from '@/components/ui/DateTimeField.vue';
import MarkdownField from '../../ui/MarkdownField.vue';
import UsernameChips from '../../ui/UsernameChips.vue';
import type { EditorialForm } from './use-editorial-form';

/** The editorial's fields: public flag and release time on one row, authors, then the Markdown with its preview. */
const draft = defineModel<EditorialForm>({ required: true });
defineProps<{ contentError?: string }>();
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid gap-4 md:grid-cols-2 md:items-end">
      <Checkbox
        v-model="draft.isPublic"
        input-id="editorial-isPublic"
        :label="$t('admin.problems.editorial.public')"
        :description="$t('admin.problems.editorial.publicHint')"
      />
      <DateTimeField
        v-model="draft.publishOn"
        scale="admin"
        input-id="editorial-publishOn"
        :label="$t('admin.problems.editorial.publishOn')"
        :hint="$t('admin.problems.editorial.publishOnHint')"
      />
    </div>
    <UsernameChips
      v-model="draft.authors"
      class="max-w-xl"
      :label="$t('admin.problems.editorial.authors')"
    />
    <MarkdownField
      v-model="draft.content"
      :label="$t('admin.problems.editorial.content')"
      preview-style="solution"
      :error="contentError"
    />
  </div>
</template>
