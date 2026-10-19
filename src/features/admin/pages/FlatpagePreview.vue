<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import UserContent from '@/components/UserContent.vue';
import Notice from '@/components/ui/Notice.vue';
import { formatClock } from '@/lib/format-date';
import { failureTextOf } from '../ui/admin-errors';
import { useRenderPreview } from '../ui/use-render-preview';
import { previewStatusOf } from './preview-status';
import AdminChip from '../ui/AdminChip.vue';

/** `savedContent` is null for a page not saved yet: then no text is "the saved text". */
const props = defineProps<{ content: string; savedContent: string | null; savedHtml: string }>();
const { t } = useI18n();
const isUntouched = computed(
  () => props.savedContent !== null && props.content === props.savedContent,
);
// An untouched text asks the server for nothing: the saved, already sanitised HTML is shown instead.
const preview = useRenderPreview(
  () => (isUntouched.value ? '' : props.content),
  () => 'flatpage',
);
const status = computed(() =>
  previewStatusOf({
    isUntouched: isUntouched.value,
    isUpdating: preview.isUpdating.value,
    isRateLimited: preview.isRateLimited.value,
  }),
);
const html = computed(() => (isUntouched.value ? props.savedHtml : preview.html.value));
const clock = computed(() =>
  preview.updatedAt.value ? formatClock(preview.updatedAt.value, { seconds: true }) : '',
);
/** "Đã cập nhật hh:mm:ss"; before any answer (an emptied box) there is no time to show. */
const chipText = computed(() =>
  t(
    status.value === 'done' && !clock.value
      ? 'admin.pages.preview.status.empty'
      : `admin.pages.preview.status.${status.value}`,
    { time: clock.value },
  ),
);
const CHIP_TONES = {
  saved: 'neutral',
  updating: 'accent',
  paused: 'caution',
  done: 'positive',
} as const;
</script>

<template>
  <section :aria-label="$t('admin.pages.preview.title')" class="flex min-w-0 flex-col gap-1.5">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-sm font-semibold">{{ $t('admin.pages.preview.title') }}</p>
      <AdminChip data-testid="preview-status" :tone="CHIP_TONES[status]">
        {{ chipText }}
      </AdminChip>
    </div>
    <div
      data-testid="preview"
      class="min-h-40 overflow-auto rounded-tile border border-line bg-surface-strong p-4"
    >
      <UserContent :html="html" />
    </div>
    <Notice v-if="status === 'paused'" tone="warning" compact role="status">
      {{
        preview.retryAfterSeconds.value
          ? $t('admin.pages.preview.pausedWait', { seconds: preview.retryAfterSeconds.value })
          : $t('admin.pages.preview.paused')
      }}
    </Notice>
    <p v-if="preview.failure.value" role="alert" class="text-sm text-negative">
      {{ failureTextOf(preview.failure.value) }}
    </p>
    <p class="text-xs text-muted">{{ $t('admin.pages.preview.hint') }}</p>
  </section>
</template>
