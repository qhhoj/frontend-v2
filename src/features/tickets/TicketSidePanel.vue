<script setup lang="ts">
import { computed } from 'vue';
import type { TicketDetail } from '@/api/types/tickets';
import { translate } from '@/i18n';
import GlassCard from '@/components/GlassCard.vue';
import UserName from '@/components/UserName.vue';
import { formatAgo } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { useTicketPatch } from './use-ticket-patch';

const props = defineProps<{ ticket: TicketDetail }>();
const session = useSessionStore();
const locale = useLocaleStore();
const now = Date.now();
const { isPending, failureKey, patch } = useTicketPatch(props.ticket.id);
/** Creators close and reopen their own tickets; staff (`can.assign`) may do it on any they can read. */
const canToggle = computed(
  () => session.user?.id === props.ticket.creator.id || props.ticket.can.assign,
);
const linkLabel = computed(() =>
  props.ticket.link.type === 'problem'
    ? (props.ticket.link.key ?? props.ticket.link.title)
    : translate('tickets.general'),
);
const toggleLabel = computed(() => (props.ticket.isOpen ? 'ticket.close' : 'ticket.reopen'));
const DT = 'text-[13px] font-semibold text-muted';
const DD = 'text-sm';
const BUSY_BUTTON = 'cursor-progress bg-accent-soft text-accent-soft-text';
const BUTTON = 'min-h-11 w-full rounded-pill px-5 font-semibold';
</script>

<template>
  <GlassCard as="aside" class="flex flex-col gap-4 p-5">
    <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
      <dt :class="DT">{{ $t('ticket.link') }}</dt>
      <dd :class="DD">{{ linkLabel }}</dd>
      <dt :class="DT">{{ $t('ticket.creator') }}</dt>
      <dd :class="DD">
        <UserName :username="ticket.creator.username" :rating="ticket.creator.rating" />
      </dd>
      <dt :class="DT">{{ $t('ticket.assignees') }}</dt>
      <dd :class="DD">
        <template v-if="ticket.assignees.length">
          <template v-for="(assignee, index) in ticket.assignees" :key="assignee.id">
            <UserName :username="assignee.username" :rating="assignee.rating" />
            <span v-if="index < ticket.assignees.length - 1">, </span>
          </template>
        </template>
        <template v-else>{{ $t('tickets.unassigned') }}</template>
      </dd>
      <dt :class="DT">{{ $t('ticket.updated') }}</dt>
      <dd :class="DD">{{ formatAgo(ticket.lastMessageAt, now, locale.locale) }}</dd>
    </dl>
    <section class="flex flex-col gap-2 border-t border-line pt-4">
      <h2 class="text-sm font-semibold">{{ $t('ticket.status') }}</h2>
      <p class="text-[13px] text-muted">{{ $t('ticket.statusHint') }}</p>
      <button
        v-if="canToggle"
        type="button"
        data-testid="toggle-open"
        :aria-busy="isPending ? 'true' : undefined"
        :class="[BUTTON, isPending ? BUSY_BUTTON : 'border border-line hover:bg-surface-hover']"
        @click="patch({ isOpen: !ticket.isOpen })"
      >
        {{ $t(toggleLabel) }}
      </button>
      <p v-if="failureKey" role="alert" class="text-[13px] text-negative">
        {{ $t(failureKey) }}
      </p>
    </section>
  </GlassCard>
</template>
