<script setup lang="ts">
import type { TicketLink } from '@/api/types/tickets';
import Chip from '@/components/ui/Chip.vue';

/** What a ticket is about: the problem code, or "General issue" for a page that is not a problem. Shared with the ticket page (Task 16). */
defineProps<{ link: TicketLink }>();
</script>

<template>
  <Chip v-if="link.type === 'problem'" class="font-mono">{{ link.key ?? link.title }}</Chip>
  <Chip v-else>{{ $t('tickets.general') }}</Chip>
</template>
