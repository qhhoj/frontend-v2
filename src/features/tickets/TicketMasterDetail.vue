<script setup lang="ts">
/**
 * Master-detail for the ticket queue. From `xl` the list sits on the left and the open ticket on the right. Below `xl`
 * one of them fills the page: `showing="list"` on the list page, `showing="detail"` on a ticket.
 */
defineProps<{ showing: 'list' | 'detail' }>();
</script>

<template>
  <div class="grid items-start gap-6 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
    <div :class="showing === 'detail' && 'max-xl:hidden'">
      <slot name="list" />
    </div>
    <div class="min-w-0" :class="showing === 'list' && 'max-xl:hidden'">
      <slot />
    </div>
  </div>
</template>
