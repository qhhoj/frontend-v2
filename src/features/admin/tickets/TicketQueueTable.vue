<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Star } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import type { NumberedPageMeta } from '@/api/client';
import type { TicketListItem, TicketListQuery } from '@/api/types/tickets';
import { formatDateTime, formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminBit from '../shell/AdminBit.vue';
import AdminChip from '../ui/AdminChip.vue';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import type { AdminColumn } from '../ui/table/table-columns';
import { queueLocation } from './ticket-queue';

/**
 * The rows as the server returned them: the status is the server's filter, so nothing is filtered here. With a ticket open
 * beside the list (`narrow`) the assignee and message columns step aside; the open ticket shows both.
 */
const props = defineProps<{
  items: TicketListItem[];
  meta: NumberedPageMeta | undefined;
  loading: boolean;
  error: unknown;
  filters: TicketListQuery;
  ticketId: string | null;
  narrow: boolean;
}>();
defineEmits<{ retry: [] }>();
const router = useRouter();
const locale = useLocaleStore();
const { t } = useI18n();
const columns = computed<AdminColumn[]>(() => [
  { key: 'ticket', label: t('admin.tickets.table.ticket'), priority: 'primary' },
  { key: 'status', label: t('admin.tickets.table.status'), priority: 'badge' },
  ...(props.narrow
    ? []
    : [
        { key: 'assignees', label: t('admin.tickets.table.assignees') },
        { key: 'messages', label: t('admin.tickets.table.messages'), align: 'end' as const },
      ]),
  { key: 'updated', label: t('admin.tickets.table.updated'), cellClass: 'whitespace-nowrap' },
]);
const selectTicket = (id: string) => router.replace({ query: queueLocation(props.filters, id) });
const byline = (ticket: TicketListItem) => `${ticket.creator.username} · ${ticket.link.title}`;
const rowAttrs = (ticket: TicketListItem) => ({
  'data-ticket': ticket.id,
  class: ticket.id === props.ticketId ? 'bg-accent-soft' : undefined,
});
</script>

<template>
  <AdminDataTable
    :pager="meta ? { meta, label: $t('admin.tickets.table.pager') } : undefined"
    :columns="columns"
    :rows="items"
    :row-key="(ticket) => ticket.id"
    :row-label="(ticket) => ticket.title"
    :row-attrs="rowAttrs"
    :label="$t('admin.tickets.table.caption')"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <template #empty>
      <p class="m-0 flex flex-col items-center gap-2 p-8 text-center text-muted">
        <AdminBit placement="empty" />
        {{ $t('admin.tickets.table.empty') }}
      </p>
    </template>
    <template #cell-ticket="{ row }">
      <button
        type="button"
        class="flex min-h-10 min-w-0 flex-col items-start py-1.5 text-left"
        :aria-pressed="row.id === ticketId ? 'true' : 'false'"
        @click="selectTicket(row.id)"
      >
        <span class="font-semibold break-words">{{ row.title }}</span>
        <span class="flex items-center gap-1 text-meta text-muted">
          {{ byline(row) }}
          <template v-if="row.isContributive">
            <Star aria-hidden="true" class="size-3.5 text-accent-text" :stroke-width="1.75" />
            <span class="sr-only">{{ $t('admin.tickets.table.contributive') }}</span>
          </template>
        </span>
      </button>
    </template>
    <template #cell-status="{ row }">
      <AdminChip :tone="row.isOpen ? 'accent' : 'neutral'">
        {{ row.isOpen ? $t('admin.tickets.table.open') : $t('admin.tickets.table.closed') }}
      </AdminChip>
    </template>
    <template #cell-assignees="{ row }">
      <span v-if="row.assignees.length" class="flex max-w-full min-w-0 flex-wrap gap-x-2 gap-y-1">
        <AdminUserLabel
          v-for="assignee in row.assignees"
          :key="assignee.id"
          :username="assignee.username"
          :rating="assignee.rating"
          class="max-w-full"
        />
      </span>
      <span v-else class="text-muted">{{ $t('admin.tickets.table.unassigned') }}</span>
    </template>
    <template #cell-messages="{ row }">{{
      formatNumber(row.messageCount, locale.locale)
    }}</template>
    <template #cell-updated="{ row }">{{
      formatDateTime(row.lastMessageAt, locale.locale)
    }}</template>
  </AdminDataTable>
</template>
