<script setup lang="ts">
import { previewComment } from '@/api/comments.api';
import UserContent from '@/components/UserContent.vue';
import { useDebouncedPreview } from '@/lib/use-debounced-preview';

/** The composer's "Preview" panel: the text rendered by the backend exactly as posting would, 0.5 s after the last key, only while shown. */
const props = defineProps<{ text: string; isActive: boolean }>();
const preview = useDebouncedPreview(() => props.text, previewComment, {
  isActive: () => props.isActive,
});
</script>

<template>
  <div class="min-h-[106px] rounded-row border border-line bg-surface-strong px-3 py-2.5">
    <p v-if="!text.trim()" class="text-sm text-muted">{{ $t('comments.preview.empty') }}</p>
    <template v-else>
      <p v-if="preview.isRateLimited.value" role="status" class="mb-2 text-sm text-muted">
        {{
          preview.retryAfterSeconds.value
            ? $t('comments.preview.rateLimitedWait', { seconds: preview.retryAfterSeconds.value })
            : $t('comments.preview.rateLimited')
        }}
      </p>
      <p v-else-if="preview.failure.value" role="alert" class="mb-2 text-sm text-negative">
        {{ $t('comments.preview.failed') }}
      </p>
      <UserContent v-if="preview.html.value" :html="preview.html.value" />
      <p v-else-if="preview.isUpdating.value" class="text-sm text-muted">
        {{ $t('comments.preview.loading') }}
      </p>
    </template>
  </div>
</template>
