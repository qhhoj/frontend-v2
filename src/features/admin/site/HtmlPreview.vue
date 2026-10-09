<script setup lang="ts">
import { previewDocument } from './config-kinds';

/** Shows the value in a script-less frame; the page never renders the value itself (no `v-html`). */
defineProps<{ html: string }>();
</script>

<template>
  <div class="flex flex-col gap-2">
    <p class="text-sm font-semibold">{{ $t('admin.site.config.previewLabel') }}</p>
    <iframe
      :srcdoc="previewDocument(html)"
      sandbox=""
      :title="$t('admin.site.config.previewTitle')"
      class="h-40 w-full rounded-tile border border-line bg-surface-solid"
    />
    <p class="text-xs text-muted">{{ $t('admin.site.config.previewNote') }}</p>
  </div>
</template>
