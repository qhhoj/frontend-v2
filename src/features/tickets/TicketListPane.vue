<script setup lang="ts">
import type { TicketListItem } from '@/api/types/tickets';
import UserName from '@/components/UserName.vue';
import { formatNumber } from '@/lib/format';
import { formatAgo } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import TicketLinkChip from './TicketLinkChip.vue';
import TicketStatusPill from './TicketStatusPill.vue';
import { shortTicketId } from './ticket-filters';

/** Dense rows, two lines each: the title with its status chip, then the id, link, handlers, message count and update time. `activeId` marks the open ticket. */
defineProps<{ tickets: TicketListItem[]; activeId?: string }>();
const locale = useLocaleStore();
// Relative times ("2 giờ trước") only move minute by minute.
const now = useNow(60_000);
</script>

<template>
  <ul :aria-label="$t('tickets.title')" class="flex flex-col">
    <li
      v-for="ticket in tickets"
      :key="ticket.id"
      class="relative border-t border-line px-4 py-2.5 first:border-t-0 hover:bg-surface-strong"
      :class="ticket.id === activeId && 'bg-accent-soft hover:bg-accent-soft'"
    >
      <div class="flex items-start gap-2">
        <RouterLink
          :to="{ name: 'ticket', params: { id: ticket.id } }"
          :aria-current="ticket.id === activeId ? 'page' : undefined"
          class="min-w-0 flex-1 text-meta leading-5 font-semibold text-content after:absolute after:inset-0 hover:underline"
        >
          {{ ticket.title }}
        </RouterLink>
        <TicketStatusPill
          :is-open="ticket.isOpen"
          :is-contributive="ticket.isContributive"
          size="sm"
          class="shrink-0"
        />
      </div>
      <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-muted">
        <span class="font-mono">{{ shortTicketId(ticket.id) }}</span>
        <TicketLinkChip :link="ticket.link" />
        <span>
          <template v-for="(user, index) in ticket.assignees" :key="user.id"
            ><template v-if="index">, </template
            ><UserName :username="user.username" :rating="user.rating"
          /></template>
          <template v-if="!ticket.assignees.length">{{ $t('tickets.unassigned') }}</template>
        </span>
        <span class="ml-auto font-mono whitespace-nowrap tabular-nums">
          {{ formatNumber(ticket.messageCount, locale.locale) }} ·
          {{ formatAgo(ticket.lastMessageAt, now, locale.locale) }}
        </span>
      </div>
    </li>
  </ul>
</template>
