<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { API_BASE } from '@/api/client';
import type { ShareView } from '@/api/types/shares';
import Card from '@/components/ui/Card.vue';
import { aceForSubmissionKey } from '@/components/code-language-keys';
import { showCode } from '@/components/code-highlight';
import SourceFileBar from '@/features/submissions/SourceFileBar.vue';
import { normalizeNewlines, sourceLineCount } from '@/lib/source';

/**
 * The code of a share: line numbers on the left, the highlighted text (plain first, coloured once the language's parser has
 * loaded), then the file bar with raw, download and copy. Same look as the submission page's source card.
 */
const props = defineProps<{ share: ShareView }>();
const source = computed(() => normalizeNewlines(props.share.source));
const block = ref<HTMLElement | null>(null);
watchEffect(() => {
  const ace = aceForSubmissionKey(props.share.language.key);
  if (block.value) void showCode(block.value, source.value, ace);
});
/** One text node for the whole gutter, so a 65 536-line source adds one element, not thousands. */
const lineNumbers = computed(() =>
  Array.from({ length: sourceLineCount(source.value) }, (_unused, index) => index + 1).join('\n'),
);
</script>

<template>
  <Card as="div" class="min-w-0 overflow-hidden rounded-card">
    <div class="px-6 pt-5 pb-3">
      <h2 class="section-title">{{ $t('share.code.title') }}</h2>
    </div>
    <div
      tabindex="0"
      role="region"
      :aria-label="$t('share.code.title')"
      class="flex max-h-[75dvh] overflow-auto bg-surface-strong py-4 font-mono text-meta leading-relaxed focus-visible:-outline-offset-2"
    >
      <pre aria-hidden="true" class="shrink-0 pr-4 pl-6 text-right text-muted select-none">{{
        lineNumbers
      }}</pre>
      <pre ref="block" class="pr-6"></pre>
    </div>
    <SourceFileBar
      :base="`${API_BASE}/shares/${encodeURIComponent(share.code)}`"
      :filename="share.filename"
      :language-key="share.language.key"
      :language-name="share.language.name"
      :text="source"
    />
  </Card>
</template>
