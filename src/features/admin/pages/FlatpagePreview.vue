<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import UserContent from '@/components/UserContent.vue';
import { INTL_LOCALES } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { failureTextOf } from '../ui/admin-errors';
import { useRenderPreview } from '../ui/use-render-preview';
import { previewStatusOf } from './preview-status';

/** `savedContent` is null for a page not saved yet: then no text is "the saved text". */
const props = defineProps<{ content: string; savedContent: string | null; savedHtml: string }>();
const { t } = useI18n();
const localeStore = useLocaleStore();
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
  preview.updatedAt.value
    ? new Intl.DateTimeFormat(INTL_LOCALES[localeStore.locale], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }).format(preview.updatedAt.value)
    : '',
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
const CHIP_CLASS = {
  saved: 'border border-line text-muted',
  updating: 'bg-accent-soft text-accent-soft-text',
  paused: 'bg-verdict-tle-bg text-verdict-tle',
  done: 'bg-verdict-ac-bg text-verdict-ac',
} as const;
</script>

<template>
  <section :aria-label="$t('admin.pages.preview.title')" class="flex min-w-0 flex-col gap-1.5">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-sm font-semibold">{{ $t('admin.pages.preview.title') }}</p>
      <span
        data-testid="preview-status"
        class="rounded-pill px-2.5 py-0.5 text-xs font-semibold"
        :class="CHIP_CLASS[status]"
      >
        {{ chipText }}
      </span>
    </div>
    <div
      data-testid="preview"
      class="min-h-40 overflow-auto rounded-tile border border-line bg-surface-strong p-4"
    >
      <UserContent :html="html" />
    </div>
    <p
      v-if="status === 'paused'"
      role="status"
      class="rounded-row bg-verdict-tle-bg p-3 text-sm text-verdict-tle"
    >
      {{
        preview.retryAfterSeconds.value
          ? $t('admin.pages.preview.pausedWait', { seconds: preview.retryAfterSeconds.value })
          : $t('admin.pages.preview.paused')
      }}
    </p>
    <p v-if="preview.failure.value" role="alert" class="text-sm text-negative">
      {{ failureTextOf(preview.failure.value) }}
    </p>
    <p class="text-xs text-muted">{{ $t('admin.pages.preview.hint') }}</p>
  </section>
</template>
