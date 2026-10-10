<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { NumberedPageMeta } from '@/api/client';
import type { TicketListItem, TicketListQuery } from '@/api/types/tickets';
import ScrollRegion from '@/components/ScrollRegion.vue';
import { formatDateTime, formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminBit from '../shell/AdminBit.vue';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { queueLocation } from './ticket-queue';

/** The rows as the server returned them: the status is the server's filter, so nothing is filtered here. */
const props = defineProps<{
  items: TicketListItem[];
  meta: NumberedPageMeta;
  filters: TicketListQuery;
  ticketId: string | null;
}>();
const router = useRouter();
const locale = useLocaleStore();
const total = computed(() => ('total' in props.meta ? props.meta.total : props.items.length));
const hasNext = computed(() => props.filters.page * props.meta.pageSize < total.value);
const CELL = 'px-3 py-3 align-top';
const HEAD = 'px-3 py-3 text-left text-[13px] font-medium text-muted';
/** Who is assigned and how many messages show from 2xl up; below it the list is half a screen wide and the open ticket shows both. */
const WIDE_ONLY = 'hidden 2xl:table-cell';

const selectTicket = (id: string) => router.replace({ query: queueLocation(props.filters, id) });
const goToPage = (page: number) =>
  router.replace({
    query: queueLocation({ ...props.filters, page }, props.ticketId),
  });
const statusKey = (ticket: TicketListItem) =>
  ticket.isOpen ? 'admin.tickets.table.open' : 'admin.tickets.table.closed';
const byline = (ticket: TicketListItem) => `${ticket.creator.username} · ${ticket.link.title}`;
</script>

<template>
  <section class="flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface">
    <p v-if="!items.length" class="flex flex-col items-center gap-2 p-8 text-center text-muted">
      <AdminBit placement="empty" />
      {{ $t('admin.tickets.table.empty') }}
    </p>
    <ScrollRegion v-else :label="$t('admin.tickets.table.caption')">
      <table class="w-full border-collapse text-sm">
        <caption class="sr-only">
          {{
            $t('admin.tickets.table.caption')
          }}
        </caption>
        <thead>
          <tr class="border-b border-line">
            <th scope="col" :class="HEAD">{{ $t('admin.tickets.table.status') }}</th>
            <th scope="col" :class="HEAD">{{ $t('admin.tickets.table.ticket') }}</th>
            <th scope="col" :class="`${HEAD} ${WIDE_ONLY}`">
              {{ $t('admin.tickets.table.assignees') }}
            </th>
            <th scope="col" :class="`${HEAD} ${WIDE_ONLY} text-right`">
              {{ $t('admin.tickets.table.messages') }}
            </th>
            <th scope="col" :class="`${HEAD} whitespace-nowrap`">
              {{ $t('admin.tickets.table.updated') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ticket in items" :key="ticket.id" class="border-t border-line">
            <td :class="CELL">{{ $t(statusKey(ticket)) }}</td>
            <td :class="CELL">
              <button
                type="button"
                class="block min-h-11 text-left"
                :aria-pressed="ticket.id === ticketId ? 'true' : 'false'"
                @click="selectTicket(ticket.id)"
              >
                <span class="font-semibold">{{ ticket.title }}</span>
                <span class="block text-[13px] text-muted">
                  {{ byline(ticket) }}
                  <template v-if="ticket.isContributive">
                    <span aria-hidden="true">★</span>
                    <span class="sr-only">{{ $t('admin.tickets.table.contributive') }}</span>
                  </template>
                </span>
              </button>
            </td>
            <td :class="`${CELL} ${WIDE_ONLY}`">
              <ul v-if="ticket.assignees.length" class="flex flex-col gap-1">
                <li v-for="assignee in ticket.assignees" :key="assignee.id">
                  <AdminUserLabel :username="assignee.username" :rating="assignee.rating" />
                </li>
              </ul>
              <span v-else class="text-muted">{{ $t('admin.tickets.table.unassigned') }}</span>
            </td>
            <td :class="`${CELL} ${WIDE_ONLY} text-right font-mono tabular-nums`">
              {{ formatNumber(ticket.messageCount, locale.locale) }}
            </td>
            <td :class="`${CELL} whitespace-nowrap`">
              {{ formatDateTime(ticket.lastMessageAt, locale.locale) }}
            </td>
          </tr>
        </tbody>
      </table>
    </ScrollRegion>
    <footer
      class="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-[13px] text-muted"
    >
      <span>
        {{
          $t('admin.tickets.table.footer', {
            shown: formatNumber(items.length, locale.locale),
            total: formatNumber(total, locale.locale),
          })
        }}
      </span>
      <span class="flex gap-2">
        <button
          type="button"
          class="min-h-11 rounded-pill border border-line px-4 font-semibold text-content"
          :disabled="filters.page <= 1"
          @click="goToPage(filters.page - 1)"
        >
          {{ $t('admin.tickets.table.previous') }}
        </button>
        <button
          type="button"
          class="min-h-11 rounded-pill border border-line px-4 font-semibold text-content"
          :disabled="!hasNext"
          @click="goToPage(filters.page + 1)"
        >
          {{ $t('admin.tickets.table.next') }}
        </button>
      </span>
    </footer>
  </section>
</template>
