<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { IMAGE_ACCEPT, IMAGE_MAX_BYTES } from '@/features/admin/problems/limits';
import { useLogoUpload } from '@/features/admin/organizations/use-logo-upload';
import AppButton from '@/components/ui/AppButton.vue';
import Notice from '@/components/ui/Notice.vue';
import UploadButton from '@/components/ui/UploadButton.vue';
import { failureTextOf } from '@/features/admin/ui/admin-errors';
import FormField from '@/components/ui/FormField.vue';
import TextInput from '@/components/ui/TextInput.vue';
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
        class="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-pill border border-line font-display text-section leading-7 font-bold"
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
          <AppButton
            v-if="canUpload"
            tone="link"
            :aria-expanded="isUrlShown"
            :aria-controls="urlBoxId"
            @click="isUrlOpen = !isUrlOpen"
          >
            {{ $t('orgAdmin.info.avatarUseUrl') }}
          </AppButton>
        </div>
        <p class="text-caption leading-4 text-muted">{{ $t(hint) }}</p>
      </div>
    </div>
    <FormField
      v-show="isUrlShown"
      :id="urlBoxId"
      :input-id="urlInputId"
      :label="$t('orgAdmin.info.avatarUrl')"
      :error="error"
    >
      <TextInput
        v-model="logo"
        class="font-mono text-sm"
        maxlength="150"
        inputmode="url"
        placeholder="https://…"
      />
    </FormField>
    <Notice v-if="upload.failure.value" tone="danger">
      {{ failureTextOf(upload.failure.value) }}
    </Notice>
  </div>
</template>
