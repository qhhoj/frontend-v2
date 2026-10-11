<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import UserContent from '@/components/UserContent.vue';
import type { PreviewSource } from '@/api/types/admin-common';
import { INPUT, TOGGLE } from './controls';
import { failureTextOf, formatWait } from './admin-errors';
import { useI18n } from 'vue-i18n';
import { useRenderPreview } from './use-render-preview';

const text = defineModel<string>({ required: true });
/** `previewStyle`: the problem style to preview with, or `'flatpage'` for a static page (plan 8f-2). */
const props = defineProps<{
  label: string;
  previewStyle: PreviewSource;
  hint?: string;
  error?: string;
  /** Heading of the preview column; defaults to the style name. */
  previewLabel?: string;
}>();
const id = useId();
const preview = useRenderPreview(
  () => text.value,
  () => props.previewStyle,
);
const { t } = useI18n();
const previewHeading = computed(
  () => props.previewLabel ?? t('admin.ui.preview', { style: props.previewStyle }),
);
/** Below 1024 px one pane shows at a time ("Soạn" / "Xem trước"); from 1024 px both sit side by side. */
const pane = ref<'write' | 'preview'>('write');
const describedBy = computed(() =>
  props.error ? `${id}-error` : props.hint ? `${id}-hint` : undefined,
);
</script>

<template>
  <div class="flex flex-col gap-3">
    <div role="group" :aria-label="$t('admin.ui.markdownPanes')" class="flex gap-1 lg:hidden">
      <button
        v-for="item in ['write', 'preview'] as const"
        :key="item"
        type="button"
        :class="[TOGGLE, 'flex-1']"
        :aria-pressed="pane === item"
        @click="pane = item"
      >
        {{ $t(`admin.ui.markdownPane.${item}`) }}
      </button>
    </div>
    <div class="grid gap-4 lg:grid-cols-2">
      <div class="flex-col gap-1.5 lg:flex" :class="pane === 'write' ? 'flex' : 'hidden'">
        <label :for="id" class="text-sm font-semibold">{{ label }}</label>
        <slot name="toolbar" />
        <textarea
          :id="id"
          v-model="text"
          :rows="14"
          :class="[INPUT, 'py-2 font-mono text-sm']"
          :aria-invalid="error ? 'true' : undefined"
          :aria-describedby="describedBy"
        />
        <p v-if="error" :id="`${id}-error`" class="text-sm text-negative">{{ error }}</p>
        <p v-if="hint" :id="`${id}-hint`" class="text-xs text-muted">{{ hint }}</p>
      </div>
      <section
        :aria-label="previewHeading"
        class="flex-col gap-1.5 lg:flex"
        :class="pane === 'preview' ? 'flex' : 'hidden'"
      >
        <p class="text-sm font-semibold">{{ previewHeading }}</p>
        <div class="min-h-40 rounded-tile border border-line bg-surface-strong p-4">
          <UserContent :html="preview.html.value" />
        </div>
        <p v-if="preview.isRateLimited.value" class="text-xs text-negative">
          {{ $t('admin.ui.previewRateLimited') }}
          <template v-if="preview.retryAfterSeconds.value">
            {{ $t('admin.ui.retryIn', { wait: formatWait(preview.retryAfterSeconds.value) }) }}
          </template>
        </p>
        <p v-if="preview.failure.value" class="text-sm text-negative">
          {{ failureTextOf(preview.failure.value) }}
        </p>
        <p class="text-xs text-muted">{{ $t('admin.ui.previewHint') }}</p>
      </section>
    </div>
  </div>
</template>
