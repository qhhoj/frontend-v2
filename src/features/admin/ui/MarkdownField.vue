<script setup lang="ts">
import MarkdownEditor from '@/components/ui/MarkdownEditor.vue';
import { renderPreview } from '@/api/admin-common.api';
import type { PreviewSource } from '@/api/types/admin-common';
import { failureTextOf } from './admin-errors';

/**
 * The staff Markdown box: the kit `MarkdownEditor` previewing through `POST /problems/render-preview` in the style of
 * `previewStyle` (a problem style, or `'flatpage'`). `layout="tabs"` shows one pane at a time; the default `split` puts write and
 * preview side by side from 1024 px.
 */
const text = defineModel<string>({ required: true });
const props = defineProps<{
  label: string;
  previewStyle: PreviewSource;
  hint?: string;
  error?: string;
  layout?: 'split' | 'tabs';
}>();
const render = (markdown: string) => renderPreview(props.previewStyle, markdown);
</script>

<template>
  <MarkdownEditor
    v-model="text"
    :label="label"
    :preview="render"
    :preview-key="previewStyle"
    :hint="hint"
    :error="error"
    :split="layout !== 'tabs'"
    :rows="layout === 'tabs' ? 6 : 14"
    :failure-text="failureTextOf"
  >
    <template v-if="$slots.toolbar" #toolbar><slot name="toolbar" /></template>
  </MarkdownEditor>
</template>
