<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { IMAGE_ACCEPT, IMAGE_MAX_BYTES } from '@/features/admin/problems/limits';
import { useLogoUpload } from '@/features/admin/organizations/use-logo-upload';
import AdminStatus from '@/features/admin/ui/AdminStatus.vue';
import UploadButton from '@/features/admin/ui/UploadButton.vue';
import { failureTextOf } from '@/features/admin/ui/admin-errors';
import { INPUT } from '@/features/admin/ui/controls';
import { initialsOf, tileClass } from '../org-visuals';

/**
 * The organization's avatar: a round tile (the image, or initials) that opens the file picker, a "Đổi ảnh" button and a
 * "Dùng URL" link that discloses the URL box. Without upload permission the URL box is always shown.
 */
const logo = defineModel<string>({ required: true });
/** True while an upload runs, so the form holds its save. */
const isUploading = defineModel<boolean>('uploading', { default: false });
const props = defineProps<{ name: string; slug: string; error?: string }>();

const { canUpload, hasFailed, upload } = useLogoUpload(logo, isUploading);
const fileId = useId();
const urlBoxId = useId();
const urlInputId = useId();
const isUrlOpen = ref(false);
const isUrlShown = computed(() => !canUpload.value || isUrlOpen.value || Boolean(props.error));
const initials = computed(() => initialsOf(props.name, ''));
const hint = computed(() =>
  hasFailed.value
    ? 'admin.organizations.editor.logoBroken'
    : canUpload.value
      ? 'orgAdmin.info.avatarHint'
      : 'orgAdmin.info.avatarUrlHint',
);
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-4">
      <component
        :is="canUpload ? 'label' : 'span'"
        :for="canUpload ? fileId : undefined"
        data-testid="logo-tile"
        class="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-pill border border-line font-display text-xl font-bold"
        :class="[tileClass(slug), canUpload && 'cursor-pointer hover:border-accent']"
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
        <span v-else aria-hidden="true">{{ initials }}</span>
      </component>
      <div class="flex min-w-0 flex-col gap-1">
        <div class="flex flex-wrap items-center gap-2">
          <UploadButton
            v-if="canUpload"
            :input-id="fileId"
            data-testid="logo-upload"
            :label="$t('orgAdmin.info.avatarChange')"
            :accept="IMAGE_ACCEPT"
            :max-bytes="IMAGE_MAX_BYTES"
            :is-pending="upload.isPending.value"
            @picked="upload.run"
          />
          <button
            v-if="canUpload"
            type="button"
            class="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-accent-text hover:underline"
            :aria-expanded="isUrlShown"
            :aria-controls="urlBoxId"
            @click="isUrlOpen = !isUrlOpen"
          >
            {{ $t('orgAdmin.info.avatarUseUrl') }}
          </button>
        </div>
        <p class="text-xs text-muted">{{ $t(hint) }}</p>
      </div>
    </div>
    <div v-show="isUrlShown" :id="urlBoxId" class="flex flex-col gap-1.5">
      <label :for="urlInputId" class="text-sm font-semibold">{{
        $t('orgAdmin.info.avatarUrl')
      }}</label>
      <input
        :id="urlInputId"
        v-model="logo"
        :class="`${INPUT} font-mono text-sm`"
        maxlength="150"
        inputmode="url"
        placeholder="https://…"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? `${urlInputId}-error` : undefined"
      />
      <p v-if="error" :id="`${urlInputId}-error`" class="text-sm text-negative">{{ error }}</p>
    </div>
    <AdminStatus
      v-if="upload.failure.value"
      kind="refused"
      :text="failureTextOf(upload.failure.value)"
    />
  </div>
</template>
