<script setup lang="ts">
import AdminField from '@/features/admin/ui/AdminField.vue';
import AdminSwitch from '@/features/admin/ui/AdminSwitch.vue';
import UsernameChips from '@/features/admin/ui/UsernameChips.vue';
import type { FieldErrors } from '@/features/admin/ui/admin-errors';
import { ADMIN_INPUT_CLASS } from '@/features/admin/ui/classes';
import { POST_LIMITS } from './post-form';
import type { PostFieldRights } from './post-form';
import type { UserChip } from '@/api/types/admin-common';

/** The fields only staff may change; each is locked (with the permission it needs) for those who may not. */
defineProps<{ errors: FieldErrors; rights: PostFieldRights; isNew: boolean }>();
const sticky = defineModel<boolean>('sticky', { required: true });
const globalPost = defineModel<boolean>('globalPost', { required: true });
const summary = defineModel<string>('summary', { required: true });
const ogImage = defineModel<string>('ogImage', { required: true });
const authors = defineModel<UserChip[]>('authors', { required: true });
const EDIT_ALL = 'judge.edit_all_post';
</script>

<template>
  <section
    class="flex flex-col gap-5 rounded-panel border border-line bg-surface-solid p-4 sm:p-5"
    aria-labelledby="post-staff"
  >
    <h2 id="post-staff" class="text-lg font-semibold">{{ $t('admin.postEditor.staff') }}</h2>
    <AdminSwitch
      v-model="sticky"
      :label="$t('admin.postEditor.fields.sticky')"
      :description="$t('admin.postEditor.hints.sticky')"
      :locked-by="rights.pin ? undefined : 'judge.pin_post'"
    />
    <AdminSwitch
      v-model="globalPost"
      :label="$t('admin.postEditor.fields.globalPost')"
      :description="$t('admin.postEditor.hints.globalPost')"
      :locked-by="rights.markGlobal ? undefined : 'judge.mark_global_post'"
    />
    <template v-if="rights.staff">
      <AdminField
        v-slot="{ id, describedBy }"
        :label="$t('admin.postEditor.fields.summary')"
        :hint="$t('admin.postEditor.hints.summary')"
        :error="errors.summary"
        input-id="post-summary"
      >
        <textarea
          :id="id"
          v-model="summary"
          rows="4"
          :class="[ADMIN_INPUT_CLASS, 'py-2 font-mono text-sm']"
          :aria-describedby="describedBy"
        />
      </AdminField>
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
          :class="ADMIN_INPUT_CLASS"
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
    </template>
    <p v-else class="text-xs text-muted">
      {{ $t('admin.ui.needsPermission', { permission: EDIT_ALL }) }}
    </p>
  </section>
</template>
