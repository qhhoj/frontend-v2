<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import AppButton from '@/components/ui/AppButton.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import StaffTicketFilters from './StaffTicketFilters.vue';
import TicketAlertsStrip from './TicketAlertsStrip.vue';
import TicketFilterNav from './TicketFilterNav.vue';
import TicketTable from './TicketTable.vue';
import TicketTableSkeleton from './TicketTableSkeleton.vue';
import { ticketQueryFromRoute } from './ticket-filters';
import { useTicketsQuery } from './tickets.queries';
import { useTicketStream } from './use-ticket-stream';

const route = useRoute();
const locale = useLocaleStore();
const filters = computed(() => ticketQueryFromRoute(route.query));
const { data, error, isPending, refetch } = useTicketsQuery(filters);
const { isLive, announcement } = useTicketStream(null);

const tickets = computed(() => data.value?.items ?? []);
const total = computed(() => data.value?.meta.total ?? 0);
const isSignedOut = computed(() => error.value instanceof ApiError && error.value.status === 401);
/** The viewer's whole list with no filter: an empty result here means "you have not filed one yet". */
const isDefaultList = computed(
  () =>
    filters.value.own &&
    filters.value.open === undefined &&
    !filters.value.user.length &&
    !filters.value.assignee.length,
);
</script>

<template>
  <div class="page-column">
    <PageHeader :title="$t('tickets.title')" :lead="$t('tickets.lead')">
      <template #actions>
        <AppButton tone="primary" :to="{ name: 'ticket-new' }">
          {{ $t('tickets.newTicket') }}
        </AppButton>
      </template>
    </PageHeader>
    <TicketAlertsStrip />
    <TicketFilterNav :filters="filters" :total="data?.meta.total" />
    <!-- Keyed by the whole URL: a Back or Forward to other filters remounts the inputs, so they never keep text from another query. -->
    <StaffTicketFilters :key="route.fullPath" :filters="filters" />
    <p class="sr-only" aria-live="polite">{{ announcement }}</p>
    <GlassCard as="div" class="overflow-hidden">
      <QueryState :loading="isPending" :error="null">
        <template #skeleton><TicketTableSkeleton /></template>
        <StatePanel
          v-if="isSignedOut"
          kind="signIn"
          :title="$t('tickets.signInTitle')"
          :body="$t('tickets.signInBody')"
        >
          <AppButton tone="primary" :to="{ name: 'login', query: { redirect: route.fullPath } }">
            {{ $t('tickets.signIn') }}
          </AppButton>
        </StatePanel>
        <!-- A failed refresh keeps the rows already shown: the panel sits above them. -->
        <StatePanel
          v-else-if="error"
          kind="error"
          :title="$t('tickets.errorTitle')"
          :body="$t('tickets.errorBody')"
        >
          <AppButton @click="refetch()">{{ $t('tickets.retry') }}</AppButton>
        </StatePanel>
        <template v-if="data && !isSignedOut">
          <StatePanel
            v-if="!tickets.length && isDefaultList"
            kind="empty"
            :title="$t('tickets.emptyTitle')"
            :body="$t('tickets.emptyBody')"
          >
            <AppButton tone="primary" :to="{ name: 'ticket-new' }">
              {{ $t('tickets.newTicket') }}
            </AppButton>
          </StatePanel>
          <EmptyState v-else-if="!tickets.length">{{ $t('tickets.noMatch') }}</EmptyState>
          <template v-else>
            <TicketTable :tickets="tickets" />
            <footer
              class="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-meta text-muted md:px-6"
            >
              <span>
                {{ $t('tickets.footer', { total: formatNumber(total, locale.locale) })
                }}<template v-if="isLive">{{ $t('ticket.liveFooter') }}</template>
              </span>
              <NumberedPager :meta="data.meta" :label="$t('tickets.pager')" />
            </footer>
          </template>
        </template>
      </QueryState>
    </GlassCard>
  </div>
</template>
