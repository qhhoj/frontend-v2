<script setup lang="ts">
import type { Component } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

/** One figure on the dashboard: `value` null is not loaded yet; a non-zero `needsAttention` figure is drawn louder. */
defineProps<{
  icon: Component;
  label: string;
  value: string | number | null;
  detail?: string;
  to: RouteLocationRaw;
  needsAttention?: boolean;
}>();
</script>

<template>
  <li>
    <RouterLink
      :to="to"
      class="glass flex h-full flex-col gap-1 rounded-card p-4 hover:bg-surface-hover"
      :data-attention="needsAttention || undefined"
    >
      <span class="flex items-center gap-2 text-sm text-muted">
        <component :is="icon" aria-hidden="true" class="size-4 text-accent" />{{ label }}
      </span>
      <span
        class="font-display text-3xl font-bold tabular-nums"
        :class="needsAttention ? 'text-accent-text' : ''"
      >
        {{ value ?? '…' }}
      </span>
      <span v-if="detail" class="text-xs text-muted">{{ detail }}</span>
    </RouterLink>
  </li>
</template>
