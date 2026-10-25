<script setup lang="ts">
import { IMAGE_ACCEPT, IMAGE_MAX_BYTES } from '../problems/limits';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import UploadButton from '../ui/UploadButton.vue';
import { failureTextOf } from '../ui/admin-errors';
import { INPUT } from '../ui/controls';
import { useLogoUpload } from './use-logo-upload';

/**
 * The logo path or URL with a live thumbnail, so admins see whether it loads before saving. Who may upload images can also pick a file: its URL fills the box, saved with the form.
 */
const logo = defineModel<string>({ required: true });
/** True while an upload runs: the editor holds its save, so it never saves the old logo under a "Saved". */
const isUploading = defineModel<boolean>('uploading', { default: false });
defineProps<{ error?: string }>();
const { canUpload, hasFailed, upload } = useLogoUpload(logo, isUploading);
</script>

<template>
  <AdminField
    input-id="org-logo"
    :label="$t('admin.organizations.editor.logo')"
    :hint="
      hasFailed
        ? $t('admin.organizations.editor.logoBroken')
        : canUpload
          ? $t('admin.organizations.editor.logoUploadHint')
          : $t('admin.organizations.editor.logoHint')
    "
    :error="error"
  >
    <template #default="{ id, describedBy, invalid }">
      <div class="flex flex-wrap items-center gap-3">
        <span
          class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-cell border border-line bg-surface-strong"
        >
          <img
            v-if="logo && !hasFailed"
            :key="logo"
            data-testid="logo-preview"
            :src="logo"
            :alt="$t('admin.organizations.editor.logoPreview')"
            class="size-full object-cover"
            @error="hasFailed = true"
          />
          <span v-else aria-hidden="true" class="text-caption leading-4 text-muted">—</span>
        </span>
        <input
          :id="id"
          v-model="logo"
          :class="INPUT"
          class="min-w-0 flex-1 basis-48"
          maxlength="150"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
        />
        <UploadButton
          v-if="canUpload"
          data-testid="logo-upload"
          :label="$t('admin.organizations.editor.logoUpload')"
          :accept="IMAGE_ACCEPT"
          :max-bytes="IMAGE_MAX_BYTES"
          :is-pending="upload.isPending.value"
          @picked="upload.run"
        />
      </div>
      <AdminStatus
        v-if="upload.failure.value"
        kind="refused"
        :text="failureTextOf(upload.failure.value)"
      />
    </template>
  </AdminField>
</template>
