<script setup lang="ts">
import { Lock } from 'lucide-vue-next';
import DiscordWebhooksTable from './DiscordWebhooksTable.vue';

/** The webhook URLs are secrets: each event shows only a masked target and is set, removed or tested on its own row. */
</script>

<template>
  <div class="flex flex-col gap-3">
    <p class="flex items-start gap-2 text-sm text-muted">
      <Lock aria-hidden="true" class="mt-0.5 size-4 shrink-0" :stroke-width="1.75" />
      {{ $t('admin.settings.webhooks.note') }}
    </p>
    <DiscordWebhooksTable />
  </div>
</template>
