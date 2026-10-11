<script setup lang="ts">
import { previewAnnouncement } from '@/api/contest-admin.api';
import UserContent from '@/components/UserContent.vue';
import { useDebouncedPreview } from '@/lib/use-debounced-preview';
import { failureTextOf } from '../../ui/admin-errors';

/** The announcement body as posting would render it, following the text half a second after the last key. */
const props = defineProps<{ contestKey: string; markdown: string }>();
const preview = useDebouncedPreview(
  () => props.markdown,
  async (text) => (await previewAnnouncement(props.contestKey, text)).html,
);
</script>

<template>
  <section
    :aria-label="$t('admin.contestOps.announcements.previewLabel')"
    class="flex flex-col gap-1.5"
    :aria-busy="preview.isUpdating.value || undefined"
  >
    <p class="text-sm font-semibold">{{ $t('admin.contestOps.announcements.previewLabel') }}</p>
    <div class="min-h-24 rounded-tile border border-line bg-surface-strong p-4">
      <UserContent v-if="preview.html.value" :html="preview.html.value" />
      <p v-else class="text-sm text-muted">
        {{ $t('admin.contestOps.announcements.previewEmpty') }}
      </p>
    </div>
    <p v-if="preview.isRateLimited.value" class="text-xs text-negative">
      {{ $t('admin.ui.previewRateLimited') }}
    </p>
    <p v-if="preview.failure.value" class="text-sm text-negative">
      {{ failureTextOf(preview.failure.value) }}
    </p>
  </section>
</template>
