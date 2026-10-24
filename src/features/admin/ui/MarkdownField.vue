<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import UserContent from '@/components/UserContent.vue';
import type { PreviewSource } from '@/api/types/admin-common';
import { INPUT, TOGGLE } from './controls';
import { failureTextOf, formatWait } from './admin-errors';
import { useI18n } from 'vue-i18n';
import { useRenderPreview } from './use-render-preview';

const text = defineModel<string>({ required: true });
/** `previewStyle`: the problem style to preview with, or `'flatpage'` for a static page. */
const props = defineProps<{
  label: string;
  previewStyle: PreviewSource;
  hint?: string;
  error?: string;
  /** Heading of the preview column; defaults to "Xem trước". */
  previewLabel?: string;
  /**
   * `split` (default): write and preview side by side from 1024 px. `tabs`: one editor with Viết / Xem trước tabs at every width,
   * a growing textarea and a footer with the character count; `label` is then only the textarea's accessible name.
   */
  layout?: 'split' | 'tabs';
}>();
const id = useId();
const preview = useRenderPreview(
  () => text.value,
  () => props.previewStyle,
);
const { t } = useI18n();
const previewHeading = computed(() => props.previewLabel ?? t('admin.ui.preview'));
/** Below 1024 px one pane shows at a time ("Soạn" / "Xem trước"); from 1024 px both sit side by side. */
const pane = ref<'write' | 'preview'>('write');
const tab = ref<'write' | 'preview'>('write');
const textarea = ref<HTMLTextAreaElement | null>(null);
const TABS = ['write', 'preview'] as const;

/** The textarea is as tall as its text (at least its rows), so the form never scrolls inside a box; not measurable while hidden. */
function grow() {
  const box = textarea.value;
  if (!box) return;
  box.style.height = 'auto';
  if (box.scrollHeight === 0) {
    box.style.height = '';
    return;
  }
  box.style.height = `${box.scrollHeight + box.offsetHeight - box.clientHeight}px`;
}
watch([text, tab], () => nextTick(grow));
/** A width change (resize, or the panel becoming visible) re-wraps the text, so the height is measured again. */
let width = 0;
const observer = new ResizeObserver(([entry]) => {
  if (!entry || entry.contentRect.width === width) return;
  width = entry.contentRect.width;
  grow();
});
onMounted(() => {
  grow();
  if (textarea.value) observer.observe(textarea.value);
});
onBeforeUnmount(() => observer.disconnect());

/** Arrow keys move between the tabs (roving tabindex). */
function moveTab(event: KeyboardEvent) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  tab.value = tab.value === 'write' ? 'preview' : 'write';
  document.getElementById(`${id}-tab-${tab.value}`)?.focus();
}
const describedBy = computed(() =>
  props.error ? `${id}-error` : props.hint ? `${id}-hint` : undefined,
);
</script>

<template>
  <div v-if="layout === 'tabs'" class="flex flex-col gap-2">
    <div role="tablist" :aria-label="label" class="flex gap-1 border-b border-line">
      <button
        v-for="item in TABS"
        :id="`${id}-tab-${item}`"
        :key="item"
        type="button"
        role="tab"
        :aria-selected="tab === item"
        :aria-controls="`${id}-panel-${item}`"
        :tabindex="tab === item ? 0 : -1"
        class="-mb-px min-h-11 border-b-2 px-3 text-sm font-semibold"
        :class="
          tab === item
            ? 'border-accent text-content'
            : 'border-transparent text-muted hover:text-content'
        "
        @click="tab = item"
        @keydown="moveTab"
      >
        {{ $t(`admin.ui.markdownTab.${item}`) }}
      </button>
    </div>
    <div
      :id="`${id}-panel-write`"
      role="tabpanel"
      :aria-labelledby="`${id}-tab-write`"
      :hidden="tab !== 'write'"
      class="flex flex-col gap-1.5"
    >
      <textarea
        :id="id"
        ref="textarea"
        v-model="text"
        rows="6"
        :aria-label="label"
        :class="[INPUT, 'resize-none overflow-hidden py-2 font-mono text-sm']"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
      />
      <p v-if="error" :id="`${id}-error`" class="text-sm text-negative">{{ error }}</p>
      <div class="flex justify-between gap-3 text-xs text-muted">
        <span>{{ hint ?? $t('admin.ui.markdownSupported') }}</span>
        <span>{{ $t('admin.ui.charCount', { count: text.length }) }}</span>
      </div>
    </div>
    <div
      :id="`${id}-panel-preview`"
      role="tabpanel"
      :aria-labelledby="`${id}-tab-preview`"
      :hidden="tab !== 'preview'"
      class="flex flex-col gap-1.5"
    >
      <div class="min-h-40 rounded-row border border-line bg-surface-strong p-4">
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
    </div>
  </div>
  <div v-else class="flex flex-col gap-3">
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
        <div class="min-h-40 rounded-row border border-line bg-surface-strong p-4">
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
