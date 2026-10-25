<script setup lang="ts">
import { Bold, Code, Italic, Link, List, ListOrdered, Sigma } from 'lucide-vue-next';
import { computed, nextTick, ref, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import type { PreviewSource } from '@/api/types/admin-common';
import UserContent from '@/components/UserContent.vue';
import IconButton from '@/components/ui/IconButton.vue';
import Tabs from '@/components/ui/Tabs.vue';
import type { TabItem } from '@/components/ui/Tabs.vue';
import { failureTextOf } from '@/features/admin/ui/admin-errors';
import { useRenderPreview } from '@/features/admin/ui/use-render-preview';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { applyMarkdown } from './markdown-toolbar';
import type { MarkdownAction } from './markdown-toolbar';

/** The post body: a Markdown toolbar over the source and its preview, side by side; a phone switches between them with tabs. */
const content = defineModel<string>({ required: true });
const props = defineProps<{ previewStyle: PreviewSource; error?: string }>();
const id = useId();
const isPhone = useMediaQuery(PHONE_QUERY);
const { t } = useI18n();
const tab = ref<string>('write');
const bodyTabs = computed<TabItem[]>(() =>
  (['write', 'preview'] as const).map((key) => ({ key, label: t(`postEditor.body.${key}`) })),
);
const source = ref<HTMLTextAreaElement | null>(null);
const preview = useRenderPreview(
  () => content.value,
  () => props.previewStyle,
);
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
  const box = source.value;
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
  <div class="flex flex-col gap-2.5">
    <Tabs
      v-if="isPhone"
      v-model="tab"
      :items="bodyTabs"
      :label="$t('postEditor.body.label')"
      overflow="scroll"
    />
    <div class="overflow-hidden rounded-row border border-line-control bg-surface-solid">
      <div
        v-show="!isPhone || tab === 'write'"
        role="toolbar"
        :aria-label="$t('postEditor.body.toolbar')"
        :aria-controls="id"
        class="flex flex-wrap items-center gap-0.5 border-b border-line bg-surface-strong p-1.5"
      >
        <IconButton
          v-for="tool in TOOLS"
          :key="tool.action"
          size="sm"
          :label="$t(`postEditor.body.tools.${tool.action}`)"
          @click="apply(tool.action)"
        >
          <component :is="tool.icon" aria-hidden="true" class="size-4" />
        </IconButton>
        <span class="ml-auto hidden pr-2 text-caption leading-4 text-muted sm:inline"
          >Markdown · LaTeX</span
        >
      </div>
      <div class="grid md:grid-cols-2 md:divide-x md:divide-line">
        <textarea
          v-show="!isPhone || tab === 'write'"
          :id="id"
          ref="source"
          v-model="content"
          :aria-label="$t('postEditor.body.label')"
          :aria-invalid="error ? 'true' : undefined"
          :aria-describedby="error ? `${id}-error` : undefined"
          class="min-h-72 w-full resize-y bg-transparent px-4 py-3 font-mono text-sm leading-relaxed text-content focus:outline-none md:min-h-[28rem]"
        />
        <section
          v-show="!isPhone || tab === 'preview'"
          :aria-label="$t('postEditor.body.preview')"
          class="min-h-72 min-w-0 px-4 py-3 md:min-h-[28rem]"
        >
          <UserContent v-if="content.trim()" :html="preview.html.value" />
          <p v-else class="text-sm text-muted">{{ $t('postEditor.body.empty') }}</p>
        </section>
      </div>
    </div>
    <p v-if="error" :id="`${id}-error`" class="text-sm text-negative">{{ error }}</p>
    <p v-if="preview.isRateLimited.value" class="text-caption leading-4 text-negative">
      {{ $t('admin.ui.previewRateLimited') }}
    </p>
    <p v-if="preview.failure.value" class="text-sm text-negative">
      {{ failureTextOf(preview.failure.value) }}
    </p>
  </div>
</template>
