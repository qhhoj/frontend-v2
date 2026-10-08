<script setup lang="ts">
import type { TicketListItem } from '@/api/types/tickets';
import { formatAgo, formatNumber } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import TicketLinkChip from './TicketLinkChip.vue';
import TicketStatusPill from './TicketStatusPill.vue';
import { shortTicketId } from './ticket-filters';

/** Phone (under `md`) keeps the title, its pill and the update time; the other columns come back from `md` up. */
defineProps<{ tickets: TicketListItem[] }>();
const locale = useLocaleStore();
// Relative times ("2 giờ trước") only move minute by minute.
const now = useNow(60_000);
const HIDDEN_ON_PHONE = 'hidden md:table-cell';
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
          <th scope="col" class="px-4 py-4 font-medium md:px-6">
            {{ $t('tickets.columns.title') }}
          </th>
          <th scope="col" :class="[HIDDEN_ON_PHONE, 'px-2.5 py-4 font-medium']">
            {{ $t('tickets.columns.status') }}
          </th>
          <th scope="col" :class="[HIDDEN_ON_PHONE, 'px-2.5 py-4 font-medium']">
            {{ $t('tickets.columns.assignees') }}
          </th>
          <th scope="col" :class="[HIDDEN_ON_PHONE, 'px-2.5 py-4 text-right font-medium']">
            {{ $t('tickets.columns.messages') }}
          </th>
          <th scope="col" class="px-4 py-4 text-right font-medium md:px-6">
            {{ $t('tickets.columns.updated') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ticket in tickets" :key="ticket.id" class="border-t border-line">
          <td class="px-4 py-3.5 md:px-6">
            <RouterLink
              :to="{ name: 'ticket', params: { id: ticket.id } }"
              class="font-semibold text-content hover:underline"
            >
              {{ ticket.title }}
            </RouterLink>
            <div class="mt-1.5 flex flex-wrap items-center gap-2">
              <TicketLinkChip :link="ticket.link" />
              <span class="font-mono text-xs text-muted">{{ shortTicketId(ticket.id) }}</span>
              <span class="md:hidden"
                ><TicketStatusPill
                  :is-open="ticket.isOpen"
                  :is-contributive="ticket.isContributive"
              /></span>
            </div>
          </td>
          <td :class="[HIDDEN_ON_PHONE, 'px-2.5 py-3.5']">
            <TicketStatusPill :is-open="ticket.isOpen" :is-contributive="ticket.isContributive" />
          </td>
          <td :class="[HIDDEN_ON_PHONE, 'px-2.5 py-3.5 text-muted']">
            {{
              ticket.assignees.map((user) => user.username).join(', ') || $t('tickets.unassigned')
            }}
          </td>
          <td :class="[HIDDEN_ON_PHONE, 'px-2.5 py-3.5 text-right font-mono tabular-nums']">
            {{ formatNumber(ticket.messageCount, locale.locale) }}
          </td>
          <td class="px-4 py-3.5 text-right text-muted md:px-6">
            {{ formatAgo(ticket.lastMessageAt, now, locale.locale) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
