<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import type { TicketListQuery } from '@/api/types/tickets';
import { parseUsernames } from '@/features/tickets/ticket-filters';
import { useTicketSummaryQuery } from '@/features/tickets/tickets.queries';
import AdminField from '../ui/AdminField.vue';
import AdminFilterTabs from '../ui/AdminFilterTabs.vue';
import type { AdminFilterTab } from '../ui/AdminFilterTabs.vue';
import { CHECK_CHIP, INPUT } from '../ui/controls';
import AdminFilterBar from '../ui/table/AdminFilterBar.vue';
import { useSessionStore } from '@/stores/session.store';
import TicketQueueShortcuts from './TicketQueueShortcuts.vue';
import { isMineOnly, queueLocation, seedQueueQuery, statusOf, withStatus } from './ticket-queue';
import type { QueueStatus } from './ticket-queue';

/**
 * The queue's filter row: title or creator search, the "mine" shortcuts, the status switch, and a panel with "waiting for
 * staff" (ticket staff only), own tickets and assignee.
 */
const props = defineProps<{
  filters: TicketListQuery;
  ticketId: string | null;
  resultText?: string;
  isStaff: boolean;
}>();
const router = useRouter();
const { t } = useI18n();
const session = useSessionStore();
const summary = useTicketSummaryQuery();

/** Every change writes the whole filter into the URL, with the open ticket kept. */
const show = (next: TicketListQuery) =>
  router.replace({ query: queueLocation(next, props.ticketId) });
const statusTabs = computed<AdminFilterTab[]>(() =>
  (['open', 'closed', 'all'] as const).map((status) => ({
    key: status,
    label: t(`admin.tickets.filters.${status}`),
  })),
);
const chooseStatus = (status: string) => show(withStatus(props.filters, status as QueueStatus));
const searchModel = computed({
  get: () => props.filters.q ?? '',
  set: (text: string) => void show({ ...props.filters, q: text.trim() || undefined, page: 1 }),
});
/** Waiting for staff are open tickets only, so the status follows. */
const setAwaiting = (isOn: boolean) =>
  show({
    ...props.filters,
    awaiting: isOn || undefined,
    open: isOn ? true : props.filters.open,
    page: 1,
  });
const setOwn = (own: boolean) => show({ ...props.filters, own, page: 1 });
const assigneeText = ref(props.filters.assignee.join(', '));
watch(
  () => props.filters.assignee,
  (names) => (assigneeText.value = names.join(', ')),
);
const applyAssignee = () =>
  show({ ...props.filters, assignee: parseUsernames(assigneeText.value), page: 1 });

/** "Phiếu của tôi" already shows the viewer alone as the assignee filter, so only another list becomes a chip. */
const hasAssigneeChip = computed(
  () =>
    props.filters.assignee.length > 0 && !isMineOnly(props.filters, session.user?.username ?? ''),
);
const chips = computed(() => [
  ...(props.filters.awaiting
    ? [{ key: 'awaiting', label: t('admin.tickets.filters.awaiting') }]
    : []),
  ...(props.filters.own ? [{ key: 'own', label: t('admin.tickets.filters.own') }] : []),
  ...(hasAssigneeChip.value
    ? [
        {
          key: 'assignee',
          label: t('admin.tickets.filters.assigneeChip', {
            names: props.filters.assignee.join(', '),
          }),
        },
      ]
    : []),
  // Older links filter by creator (`?user=`); the search box now covers that, so the list only shows as a chip.
  ...(props.filters.user.length
    ? [
        {
          key: 'user',
          label: t('admin.tickets.filters.userChip', { names: props.filters.user.join(', ') }),
        },
      ]
    : []),
]);
function removeChip(key: string) {
  if (key === 'awaiting') void setAwaiting(false);
  else if (key === 'own') void setOwn(false);
  else if (key === 'user') void show({ ...props.filters, user: [], page: 1 });
  else void show({ ...props.filters, assignee: [], page: 1 });
}
/** Reset returns to the queue's first-visit view (everyone's open tickets, or a setter's own), keeping the open ticket. */
const reset = () =>
  router.replace({
    query: seedQueueQuery(props.ticketId ? { ticket: props.ticketId } : {}, props.isStaff),
  });
</script>

<template>
  <AdminFilterBar
    v-model:search="searchModel"
    :search-label="$t('admin.tickets.filters.search')"
    :result-text="resultText"
    :chips="chips"
    :filter-count="chips.length"
    @remove="removeChip"
    @clear-all="reset"
  >
    <template #selects>
      <TicketQueueShortcuts :filters="filters" @show="show" />
    </template>
    <template #view>
      <AdminFilterTabs
        :tabs="statusTabs"
        :current="statusOf(filters)"
        :label="$t('admin.tickets.filters.status')"
        @update:current="chooseStatus"
      />
    </template>
    <template #filters>
      <label v-if="isStaff" :class="[CHECK_CHIP, 'self-end']">
        <input
          type="checkbox"
          name="awaiting"
          class="size-4 accent-[var(--qh-accent)]"
          :checked="filters.awaiting === true"
          @change="setAwaiting(($event.target as HTMLInputElement).checked)"
        />
        {{ $t('admin.tickets.filters.awaiting') }}
        <span
          v-if="summary.data.value?.awaitingStaff"
          class="rounded-pill bg-surface-strong px-1.5 font-mono text-xs tabular-nums"
          >{{ summary.data.value.awaitingStaff }}</span
        >
      </label>
      <label :class="[CHECK_CHIP, 'self-end']">
        <input
          type="checkbox"
          name="own"
          class="size-4 accent-[var(--qh-accent)]"
          :checked="filters.own"
          @change="setOwn(($event.target as HTMLInputElement).checked)"
        />
        {{ $t('admin.tickets.filters.own') }}
      </label>
      <AdminField
        :label="$t('admin.tickets.filters.assignee')"
        :hint="$t('admin.tickets.filters.peopleHint')"
        input-id="ticket-assignee"
      >
        <input
          id="ticket-assignee"
          v-model="assigneeText"
          name="assignee"
          type="text"
          autocomplete="off"
          :class="INPUT"
          @change="applyAssignee"
          @keydown.enter.prevent="applyAssignee"
        />
      </AdminField>
    </template>
  </AdminFilterBar>
</template>
