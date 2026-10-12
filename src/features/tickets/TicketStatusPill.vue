<script setup lang="ts">
import Chip from '@/components/ui/Chip.vue';

/** Open or closed, plus "good contribution" when staff marked it. Shared with the ticket page (Task 16). */
defineProps<{ isOpen: boolean; isContributive: boolean }>();
</script>

<template>
  <span class="inline-flex flex-wrap items-center gap-1.5">
    <Chip :tone="isOpen ? 'success' : 'neutral'" size="md">
      {{ isOpen ? $t('tickets.open') : $t('tickets.closed') }}
    </Chip>
    <Chip v-if="isContributive" tone="accent" size="md">{{ $t('tickets.contributive') }}</Chip>
  </span>
</template>
