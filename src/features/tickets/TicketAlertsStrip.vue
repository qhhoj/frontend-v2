<script setup lang="ts">
import { computed } from 'vue';
import InlineBit from '@/components/InlineBit.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { adminRouteName } from '@/features/admin/admin-screens';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import { useSessionStore } from '@/stores/session.store';
import { TICKET_BITS } from './ticket-bits';
import { useTicketSummaryQuery } from './tickets.queries';

/** Spec 3.12 alerts: open tickets assigned to the viewer and, for handlers, tickets whose last message is not staff's. */
const { can } = usePermissions();
const session = useSessionStore();
const locale = useLocaleStore();
const query = useTicketSummaryQuery();
const isHandler = computed(() => can('judge.change_ticket'));
const assignedOpen = computed(() => query.data.value?.assignedOpen ?? 0);
const awaitingStaff = computed(() =>
  isHandler.value ? (query.data.value?.awaitingStaff ?? 0) : 0,
);
const isWaiting = computed(() => assignedOpen.value > 0 || awaitingStaff.value > 0);
const isShown = computed(
  () => query.data.value !== undefined && (isHandler.value || assignedOpen.value > 0),
);
const assignedLink = computed(() => ({
  name: 'tickets',
  query: { scope: 'all', open: '1', assignee: session.user?.username ?? '' },
}));
const STRIP =
  'flex min-h-[68px] flex-wrap items-center gap-3 rounded-row bg-surface-strong px-4 py-3 text-sm';
const LINK = 'inline-flex min-h-11 items-center font-semibold text-accent-text hover:underline';
</script>

<template>
  <section
    v-if="isShown"
    role="region"
    data-testid="ticket-alerts"
    :aria-label="$t('ticketAlerts.region')"
    :class="STRIP"
  >
    <InlineBit :kind="isWaiting ? TICKET_BITS.alertsWaiting : TICKET_BITS.alertsClear" />
    <template v-if="isWaiting">
      <RouterLink v-if="assignedOpen > 0" :to="assignedLink" :class="LINK">
        {{ $t('ticketAlerts.assignedOpen', { count: formatNumber(assignedOpen, locale.locale) }) }}
      </RouterLink>
      <RouterLink
        v-if="awaitingStaff > 0"
        :to="{ name: adminRouteName('tickets'), query: { scope: 'all', open: '1' } }"
        :class="LINK"
      >
        {{
          $t('ticketAlerts.awaitingStaff', { count: formatNumber(awaitingStaff, locale.locale) })
        }}
      </RouterLink>
    </template>
    <span v-else class="min-h-11 content-center">{{ $t('ticketAlerts.clear') }}</span>
  </section>
  <div
    v-else-if="isHandler && query.isLoading.value"
    aria-hidden="true"
    data-skeleton-region="ticket-alerts"
    :class="STRIP"
  >
    <SkeletonBlock class="size-12" />
    <span class="inline-flex min-h-11 items-center"><SkeletonBlock text class="w-56" /></span>
  </div>
</template>
