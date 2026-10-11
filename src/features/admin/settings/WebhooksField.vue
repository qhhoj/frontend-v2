<script setup lang="ts">
import AdminBit from '../shell/AdminBit.vue';
import DiscordWebhooksTable from './DiscordWebhooksTable.vue';

/** The webhook URLs are secrets: each event shows only a masked target and is set, removed or tested on its own row. */
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-start gap-2">
      <p class="flex-1 text-xs text-muted">{{ $t('admin.settings.webhooks.note') }}</p>
      <AdminBit placement="security" />
    </div>
    <DiscordWebhooksTable />
  </div>
</template>
