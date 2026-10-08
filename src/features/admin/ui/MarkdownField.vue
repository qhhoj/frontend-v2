<script setup lang="ts">
import { computed, useId } from 'vue';
import UserContent from '@/components/UserContent.vue';
import type { PreviewSource } from '@/api/types/admin-common';
import { ADMIN_INPUT_CLASS } from './classes';
import { useRenderPreview } from './use-render-preview';

const text = defineModel<string>({ required: true });
/** `previewStyle`: the problem style to preview with, or `'flatpage'` for a static page (plan 8f-2). */
const props = defineProps<{
  label: string;
  previewStyle: PreviewSource;
  hint?: string;
  error?: string;
  rows?: number;
}>();
const id = useId();
const preview = useRenderPreview(
  () => text.value,
  () => props.previewStyle,
);
const describedBy = computed(() =>
  props.error ? `${id}-error` : props.hint ? `${id}-hint` : undefined,
);
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-2">
    <div class="flex flex-col gap-1.5">
      <label :for="id" class="text-sm font-semibold">{{ label }}</label>
      <slot name="toolbar" />
      <textarea
        :id="id"
        v-model="text"
        :rows="rows ?? 14"
        :class="[ADMIN_INPUT_CLASS, 'py-2 font-mono text-sm']"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
      />
      <p v-if="error" :id="`${id}-error`" class="text-sm text-negative">{{ error }}</p>
      <p v-if="hint" :id="`${id}-hint`" class="text-xs text-muted">{{ hint }}</p>
    </div>
    <section
      :aria-label="$t('admin.ui.preview', { style: previewStyle })"
      class="flex flex-col gap-1.5"
    >
      <p class="text-sm font-semibold">{{ $t('admin.ui.preview', { style: previewStyle }) }}</p>
      <div class="min-h-40 rounded-tile border border-line bg-surface-strong p-4">
        <UserContent :html="preview.html.value" />
      </div>
      <p v-if="preview.isRateLimited.value" class="text-xs text-negative">
        {{ $t('admin.ui.previewRateLimited') }}
        <template v-if="preview.retryAfterSeconds.value">
          {{ $t('admin.ui.retryIn', { seconds: preview.retryAfterSeconds.value }) }}
        </template>
      </p>
      <p class="text-xs text-muted">{{ $t('admin.ui.previewHint') }}</p>
    </section>
  </div>
</template>
