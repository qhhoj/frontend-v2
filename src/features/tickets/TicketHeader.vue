<script setup lang="ts">
import { computed } from 'vue';
import type { TicketDetail } from '@/api/types/tickets';
import GlassCard from '@/components/GlassCard.vue';
import { translate } from '@/i18n';
import StateBit from '@/components/StateBit.vue';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import TicketLinkChip from './TicketLinkChip.vue';
import TicketStatusPill from './TicketStatusPill.vue';
import { shortTicketId } from './ticket-filters';

const props = defineProps<{ ticket: TicketDetail }>();
const session = useSessionStore();
const locale = useLocaleStore();
const isCreator = computed(() => session.user?.id === props.ticket.creator.id);
/** Staff is the backend's `judge.change_ticket` answer (`can.assign`), never the staff flag. */
const isStaffView = computed(() => props.ticket.can.assign && !isCreator.value);
/** The line under the title: creator, opening date, message count and assignees (the board's wording). */
const meta = computed(() => ({
  creator: props.ticket.creator.username,
  date: formatDate(props.ticket.createdAt, 'datetime', locale.locale),
  count: formatNumber(props.ticket.messageCount, locale.locale),
  assignees:
    props.ticket.assignees.map((assignee) => assignee.username).join(', ') ||
    translate('tickets.unassigned'),
}));
/** A general issue's address becomes a link only when it is http or https; anything else stays plain text. */
function isWebUrl(text: string): boolean {
  try {
    const { protocol } = new URL(text);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
const LINK_CLASS = 'inline-flex flex-wrap items-center gap-2 text-sm hover:underline';
</script>

<template>
  <GlassCard as="header" data-testid="ticket-header" class="flex flex-col gap-3 p-5 sm:p-6">
    <nav :aria-label="$t('ticket.breadcrumb')" class="text-meta text-muted">
      <RouterLink :to="{ name: 'tickets' }" class="hover:underline">{{
        $t('ticket.list')
      }}</RouterLink>
      <span aria-hidden="true"> / </span>
      <span>{{ shortTicketId(ticket.id) }}</span>
    </nav>
    <div class="flex flex-wrap items-center gap-2">
      <TicketStatusPill :is-open="ticket.isOpen" :is-contributive="ticket.isContributive" />
      <RouterLink
        v-if="ticket.link.type === 'problem' && ticket.link.url"
        :to="ticket.link.url"
        :class="LINK_CLASS"
      >
        <TicketLinkChip :link="ticket.link" />
        <span>{{ ticket.link.title }}</span>
      </RouterLink>
      <a
        v-else-if="ticket.link.type === 'general' && isWebUrl(ticket.link.url)"
        :href="ticket.link.url"
        target="_blank"
        rel="noopener noreferrer"
        :class="LINK_CLASS"
      >
        <TicketLinkChip :link="ticket.link" />
        <span class="break-all">{{ ticket.link.title }}</span>
      </a>
      <span v-else :class="LINK_CLASS">
        <TicketLinkChip :link="ticket.link" />
        <span class="break-all">{{ ticket.link.title }}</span>
      </span>
    </div>
    <h1 class="page-title">{{ ticket.title }}</h1>
    <p v-if="isCreator" class="text-sm font-semibold text-accent-soft-text">
      {{ $t('ticket.yours') }}
    </p>
    <p v-else-if="isStaffView" class="flex items-center gap-2 text-sm font-semibold">
      <StateBit variant="staff" size="inline" />
      <span>{{ $t('ticket.staffView') }}</span>
    </p>
    <p class="text-meta text-muted">{{ $t('ticket.meta', meta) }}</p>
  </GlassCard>
</template>
