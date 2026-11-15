<script setup lang="ts">
import Chip from '@/components/ui/Chip.vue';

/** Open or closed, plus "good contribution" when staff marked it. Shared with the ticket page and the admin queue; `size` is `md` except in the dense list rows. */
withDefaults(defineProps<{ isOpen: boolean; isContributive: boolean; size?: 'sm' | 'md' }>(), {
  size: 'md',
});
</script>

<template>
  <span class="inline-flex flex-wrap items-center gap-1.5">
    <Chip :tone="isOpen ? 'success' : 'neutral'" :size="size">
      {{ isOpen ? $t('tickets.open') : $t('tickets.closed') }}
    </Chip>
    <Chip v-if="isContributive" tone="accent" :size="size">{{ $t('tickets.contributive') }}</Chip>
  </span>
</template>
