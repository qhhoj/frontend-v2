<script setup lang="ts">
import AdminField from '@/features/admin/ui/AdminField.vue';
import UsernameChips from '@/features/admin/ui/UsernameChips.vue';
import type { FieldErrors } from '@/features/admin/ui/admin-errors';
import { INPUT } from '@/features/admin/ui/controls';
import { POST_LIMITS } from './post-form';
import type { UserChip } from '@/api/types/admin-common';

/** The `edit_all_post` fields beyond the settings card: the link-preview image and, once created, the authors. */
defineProps<{ errors: FieldErrors; isNew: boolean }>();
const ogImage = defineModel<string>('ogImage', { required: true });
const authors = defineModel<UserChip[]>('authors', { required: true });
</script>

<template>
  <section
    class="flex flex-col gap-5 rounded-panel border border-line bg-surface-solid p-4 sm:p-5"
    aria-labelledby="post-staff"
  >
    <h2 id="post-staff" class="font-display text-base font-bold text-accent-text">
      {{ $t('admin.postEditor.staff') }}
    </h2>
    <AdminField
      v-slot="{ id, describedBy, invalid }"
      :label="$t('admin.postEditor.fields.ogImage')"
      :hint="$t('admin.postEditor.hints.ogImage')"
      :error="errors.ogImage"
      input-id="post-og-image"
    >
      <input
        :id="id"
        v-model="ogImage"
        :maxlength="POST_LIMITS.ogImage"
        :class="INPUT"
        :aria-describedby="describedBy"
        :aria-invalid="invalid ? 'true' : undefined"
        placeholder="https://…"
      />
    </AdminField>
    <UsernameChips
      v-if="!isNew"
      v-model="authors"
      :label="$t('admin.postEditor.fields.authors')"
      :max="20"
      :error="errors.authorIds"
    />
  </section>
</template>
