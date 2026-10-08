<script setup lang="ts">
import type { TicketLink } from '@/api/types/tickets';

/** What a ticket is about: the problem code, or "General issue" for a page that is not a problem. Shared with the ticket page (Task 16). */
defineProps<{ link: TicketLink }>();
</script>

<template>
  <span
    v-if="link.type === 'problem'"
    class="inline-flex items-center rounded-pill border border-line px-2 py-0.5 font-mono text-xs text-muted"
  >
    {{ link.key ?? link.title }}
  </span>
  <span
    v-else
    class="inline-flex items-center rounded-pill border border-line px-2 py-0.5 text-xs text-muted"
  >
    {{ $t('tickets.general') }}
  </span>
</template>
