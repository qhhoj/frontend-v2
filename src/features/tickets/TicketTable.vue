<script setup lang="ts">
import type { TicketListItem } from '@/api/types/tickets';
import UserName from '@/components/UserName.vue';
import { formatAgo, formatNumber } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import TicketLinkChip from './TicketLinkChip.vue';
import TicketStatusPill from './TicketStatusPill.vue';
import { TICKET_COLUMNS } from './ticket-columns';
import { shortTicketId } from './ticket-filters';

/** Phone (under `md`) keeps the title, its pill and the update time; the other columns come back from `md` up. */
defineProps<{ tickets: TicketListItem[] }>();
const locale = useLocaleStore();
// Relative times ("2 giờ trước") only move minute by minute.
const now = useNow(60_000);
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse text-[15px]">
      <caption class="sr-only">
        {{
          $t('tickets.title')
        }}
      </caption>
      <thead>
        <tr class="text-left text-[13px] text-muted">
          <th scope="col" :class="TICKET_COLUMNS.title.header">
            {{ $t('tickets.columns.title') }}
          </th>
          <th scope="col" :class="TICKET_COLUMNS.status.header">
            {{ $t('tickets.columns.status') }}
          </th>
          <th scope="col" :class="TICKET_COLUMNS.assignees.header">
            {{ $t('tickets.columns.assignees') }}
          </th>
          <th scope="col" :class="TICKET_COLUMNS.messages.header">
            {{ $t('tickets.columns.messages') }}
          </th>
          <th scope="col" :class="TICKET_COLUMNS.updated.header">
            {{ $t('tickets.columns.updated') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ticket in tickets" :key="ticket.id" class="border-t border-line">
          <td :class="TICKET_COLUMNS.title.cell">
            <RouterLink
              :to="{ name: 'ticket', params: { id: ticket.id } }"
              class="block leading-6 font-semibold text-content hover:underline"
            >
              {{ ticket.title }}
            </RouterLink>
            <div class="mt-1.5 flex min-h-[54px] flex-wrap items-center gap-2 md:min-h-[22px]">
              <TicketLinkChip :link="ticket.link" />
              <span class="font-mono text-xs text-muted">{{ shortTicketId(ticket.id) }}</span>
              <span class="md:hidden">
                <TicketStatusPill
                  :is-open="ticket.isOpen"
                  :is-contributive="ticket.isContributive"
                />
              </span>
            </div>
          </td>
          <td :class="TICKET_COLUMNS.status.cell">
            <TicketStatusPill :is-open="ticket.isOpen" :is-contributive="ticket.isContributive" />
          </td>
          <td :class="TICKET_COLUMNS.assignees.cell">
            <template v-for="(user, index) in ticket.assignees" :key="user.id"
              ><template v-if="index">, </template
              ><UserName :username="user.username" :rating="user.rating"
            /></template>
            <template v-if="!ticket.assignees.length">{{ $t('tickets.unassigned') }}</template>
          </td>
          <td :class="TICKET_COLUMNS.messages.cell">
            {{ formatNumber(ticket.messageCount, locale.locale) }}
          </td>
          <td :class="TICKET_COLUMNS.updated.cell">
            {{ formatAgo(ticket.lastMessageAt, now, locale.locale) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
