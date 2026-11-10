<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import FormField from '@/components/ui/FormField.vue';
import TextInput from '@/components/ui/TextInput.vue';
import UsernameChips from '@/features/admin/ui/UsernameChips.vue';
import type { FieldErrors } from '@/features/admin/ui/admin-errors';
import { POST_LIMITS } from './post-form';
import type { UserChip } from '@/api/types/admin-common';

/** The `edit_all_post` fields beyond the settings card: the link-preview image and, once created, the authors. */
defineProps<{ errors: FieldErrors; isNew: boolean }>();
const ogImage = defineModel<string>('ogImage', { required: true });
const authors = defineModel<UserChip[]>('authors', { required: true });
</script>

<template>
  <Card padding="md" :title="$t('postEditor.staff')">
    <div class="flex flex-col gap-5">
      <FormField
        :label="$t('postEditor.fields.ogImage')"
        :hint="$t('postEditor.hints.ogImage')"
        :error="errors.ogImage"
        input-id="post-og-image"
      >
        <TextInput v-model="ogImage" :maxlength="POST_LIMITS.ogImage" placeholder="https://…" />
      </FormField>
      <UsernameChips
        v-if="!isNew"
        v-model="authors"
        :label="$t('postEditor.fields.authors')"
        :max="20"
        :error="errors.authorIds"
      />
    </div>
  </Card>
</template>
