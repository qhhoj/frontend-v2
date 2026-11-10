<script setup lang="ts">
import { Bold, Code, Italic, Link, List, ListOrdered, Sigma } from 'lucide-vue-next';
import { nextTick, ref } from 'vue';
import { renderPreview } from '@/api/admin-common.api';
import type { PreviewSource } from '@/api/types/admin-common';
import IconButton from '@/components/ui/IconButton.vue';
import MarkdownEditor from '@/components/ui/MarkdownEditor.vue';
import { failureTextOf } from '@/features/admin/ui/admin-errors';
import { applyMarkdown } from './markdown-toolbar';
import type { MarkdownAction } from './markdown-toolbar';

/** The post body: the kit `MarkdownEditor` (write and live preview side by side from 1024 px) with a formatting toolbar over the source. */
const content = defineModel<string>({ required: true });
const props = defineProps<{ previewStyle: PreviewSource; error?: string }>();
const root = ref<HTMLElement | null>(null);
const render = (markdown: string) => renderPreview(props.previewStyle, markdown);
const TOOLS: { action: MarkdownAction; icon: typeof Bold }[] = [
  { action: 'bold', icon: Bold },
  { action: 'italic', icon: Italic },
  { action: 'code', icon: Code },
  { action: 'link', icon: Link },
  { action: 'bullet', icon: List },
  { action: 'numbered', icon: ListOrdered },
  { action: 'math', icon: Sigma },
];

async function apply(action: MarkdownAction) {
  const box = root.value?.querySelector('textarea');
  if (!box) return;
  const next = applyMarkdown(
    { text: content.value, start: box.selectionStart, end: box.selectionEnd },
    action,
  );
  content.value = next.text;
  await nextTick();
  box.focus();
  box.setSelectionRange(next.start, next.end);
}
</script>

<template>
  <div ref="root">
    <MarkdownEditor
      v-model="content"
      :label="$t('postEditor.body.label')"
      :preview="render"
      :preview-key="previewStyle"
      :error="error"
      :rows="14"
      split
      :failure-text="failureTextOf"
    >
      <template #toolbar>
        <div
          role="toolbar"
          :aria-label="$t('postEditor.body.toolbar')"
          class="flex flex-wrap items-center gap-0.5"
        >
          <IconButton
            v-for="tool in TOOLS"
            :key="tool.action"
            size="sm"
            :label="$t(`postEditor.body.tools.${tool.action}`)"
            @click="apply(tool.action)"
          >
            <component :is="tool.icon" aria-hidden="true" />
          </IconButton>
        </div>
      </template>
    </MarkdownEditor>
  </div>
</template>
