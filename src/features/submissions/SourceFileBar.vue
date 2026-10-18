<script setup lang="ts">
import { Download, ExternalLink } from 'lucide-vue-next';
import { computed } from 'vue';
import { API_BASE } from '@/api/client';
import CopyButton from '@/components/CopyButton.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { formatFileSize } from '@/lib/format';
import { sourceLineCount } from '@/lib/source';

/** The file under the code (kept when the code is folded): its name, language, size and the three things to do with the file. */
const props = defineProps<{
  id: string;
  filename: string | null;
  languageName: string | null;
  text: string;
}>();
const lines = computed(() => sourceLineCount(props.text));
const bytes = computed(() => new TextEncoder().encode(props.text).length);
const sizeText = computed(() =>
  bytes.value < 1024 ? `${bytes.value} B` : formatFileSize(bytes.value),
);
const base = computed(() => `${API_BASE}/submissions/${encodeURIComponent(props.id)}/source`);
</script>

<template>
  <div
    data-testid="source-file-bar"
    class="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line bg-surface px-4 py-2 sm:px-6"
  >
    <span class="min-w-36 flex-1 font-mono text-caption">
      <b v-if="filename">{{ filename }}</b>
      <span class="text-muted">
        <template v-if="filename"> · </template
        ><template v-if="languageName">{{ languageName }} · </template
        >{{ $t('submission.source.lines', { count: lines }) }} · {{ sizeText }}</span
      >
    </span>
    <template v-if="filename">
      <AppButton
        data-testid="source-raw"
        :href="`${base}/raw`"
        target="_blank"
        rel="noopener"
        :aria-label="$t('submission.source.raw')"
        :title="$t('submission.source.rawHint')"
      >
        <template #icon><ExternalLink aria-hidden="true" class="size-4" /></template>
        <span class="max-sm:sr-only">{{ $t('submission.source.rawShort') }}</span>
      </AppButton>
      <AppButton
        data-testid="source-download"
        :href="`${base}/download`"
        :download="filename"
        :aria-label="$t('submission.source.download')"
      >
        <template #icon><Download aria-hidden="true" class="size-4" /></template>
        <span class="max-sm:sr-only">{{ $t('submission.source.downloadShort') }}</span>
      </AppButton>
    </template>
    <CopyButton :text="text" :label="$t('submission.source.copy')" icon-only-on-phone />
  </div>
</template>
