<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next';
import type { Component } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import AdminChip from '../../ui/AdminChip.vue';
import { CARD } from '../../ui/controls';

/**
 * One figure on the dashboard, linking to its filtered list: `value` null is not loaded yet. A `needsAttention` figure gets
 * a caution border, the accent figure and a "Cần xử lý" chip, so the state never rests on colour alone. `linkText` says
 * where the tile goes ("Xem 3 phiếu →"), so it reads as a link (P-33).
 */
defineProps<{
  icon: Component;
  label: string;
  value: string | number | null;
  detail?: string;
  to: RouteLocationRaw;
  needsAttention?: boolean;
  linkText: string;
}>();
</script>

<template>
  <li class="min-w-0">
    <RouterLink
      :to="to"
      :class="[
        CARD,
        'flex h-full min-w-0 flex-col gap-1 p-4 wrap-anywhere hover:bg-surface-hover',
        needsAttention && 'border-verdict-tle',
      ]"
      :data-attention="needsAttention || undefined"
    >
      <span class="flex items-center gap-2 text-sm text-muted">
        <component
          :is="icon"
          aria-hidden="true"
          class="size-4 shrink-0 text-accent"
          :stroke-width="1.75"
        />{{ label }}
      </span>
      <span class="flex items-baseline gap-2">
        <span
          class="font-display text-3xl font-semibold tabular-nums"
          :class="needsAttention && 'text-accent-text'"
        >
          {{ value ?? '…' }}
        </span>
        <AdminChip v-if="needsAttention" tone="caution">
          {{ $t('admin.shell.overview.attention') }}
        </AdminChip>
      </span>
      <span v-if="detail" class="text-xs text-muted">{{ detail }}</span>
      <span
        class="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-semibold text-accent-text"
      >
        {{ linkText }}
        <ArrowRight aria-hidden="true" class="size-3.5" :stroke-width="2" />
      </span>
    </RouterLink>
  </li>
</template>
