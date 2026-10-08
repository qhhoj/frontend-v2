<script setup lang="ts">
/** Open or closed, plus "good contribution" when staff marked it. Shared with the ticket page (Task 16). */
defineProps<{ isOpen: boolean; isContributive: boolean }>();
</script>

<template>
  <span class="inline-flex flex-wrap items-center gap-1.5">
    <span
      class="inline-flex items-center rounded-pill px-2.5 py-0.5 text-[13px] font-semibold"
      :class="
        isOpen ? 'bg-verdict-ac-bg text-verdict-ac' : 'bg-verdict-pending-bg text-verdict-pending'
      "
    >
      {{ isOpen ? $t('tickets.open') : $t('tickets.closed') }}
    </span>
    <span
      v-if="isContributive"
      class="inline-flex items-center rounded-pill bg-accent-soft px-2.5 py-0.5 text-[13px] font-semibold text-accent-soft-text"
    >
      {{ $t('tickets.contributive') }}
    </span>
  </span>
</template>
