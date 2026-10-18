<script setup lang="ts">
import { computed } from 'vue';
import type { TicketDetail } from '@/api/types/tickets';
import { TICKET_TIMELINE_CAP } from '@/api/types/tickets';
import UserContent from '@/components/UserContent.vue';
import UserName from '@/components/UserName.vue';
import Chip from '@/components/ui/Chip.vue';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import TicketEventRow from './TicketEventRow.vue';
import { TICKET_BITS } from './ticket-bits';
import { endsClosed, eventCount, threadRows } from './ticket-thread';

/** The thread (M8C): messages and state changes by time. Counts are announced by the page's own region, not here. */
const props = defineProps<{ ticket: TicketDetail; isLive: boolean }>();
const locale = useLocaleStore();
const rows = computed(() => threadRows(props.ticket.timeline, props.ticket.can.markGood));
const events = computed(() => eventCount(props.ticket.timeline, props.ticket.can.markGood));
/** The backend keeps the newest 200 events: at 200 the older ones are gone. */
const hasHitCap = computed(() => eventCount(props.ticket.timeline, true) >= TICKET_TIMELINE_CAP);
const isAssignee = (username: string) =>
  props.ticket.assignees.some((assignee) => assignee.username === username);
const when = (at: string) => formatDate(at, 'datetime', locale.locale);
</script>

<template>
  <section :aria-label="$t('ticket.messages')" class="flex flex-col gap-4">
    <p data-testid="thread-counts" class="text-meta text-muted">
      {{
        $t('ticketTimeline.counts', {
          messages: formatNumber(ticket.messageCount, locale.locale),
          events: formatNumber(events, locale.locale),
        })
      }}
    </p>
    <SettingsNotice v-if="hasHitCap" tone="info" :bit="TICKET_BITS.cap">
      <strong class="block">{{ $t('ticketTimeline.capTitle') }}</strong>
      <span class="block">{{ $t('ticketTimeline.capBody') }}</span>
    </SettingsNotice>
    <template v-for="row in rows" :key="row.key">
      <article
        v-if="row.kind === 'message'"
        data-testid="ticket-message"
        class="flex gap-3 rounded-card border border-line bg-surface p-4"
      >
        <UserAvatar :username="row.message.author.username" :size="32" />
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <UserName :username="row.message.author.username" :rating="row.message.author.rating" />
            <Chip v-if="isAssignee(row.message.author.username)" tone="accent">
              {{ $t('ticket.assigneeChip') }}
            </Chip>
            <time :datetime="row.message.createdAt" class="text-meta text-muted">
              {{ when(row.message.createdAt) }}
            </time>
          </div>
          <UserContent :html="row.message.bodyHtml" />
        </div>
      </article>
      <TicketEventRow v-else-if="row.kind === 'event'" :event="row.event" />
      <details
        v-else
        data-testid="ticket-event-group"
        class="rounded-row border border-line bg-surface-strong"
      >
        <summary
          class="flex min-h-11 cursor-pointer flex-wrap items-center gap-2 px-4 py-2 text-meta text-muted"
        >
          <span class="font-semibold text-content">
            {{ $t('ticketTimeline.group', { count: row.events.length }) }}
          </span>
          <span>
            {{
              $t('ticketTimeline.range', {
                from: when(row.events[0]!.at),
                to: when(row.events[row.events.length - 1]!.at),
              })
            }}
          </span>
        </summary>
        <div class="flex flex-col px-4 pb-3">
          <TicketEventRow v-for="event in row.events" :key="event.id" :event="event" />
        </div>
      </details>
    </template>
    <p v-if="endsClosed(rows)" data-testid="thread-closed-note" class="text-meta text-muted">
      {{ $t('ticketTimeline.noMessagesAfterClose') }}
    </p>
    <p class="flex items-center gap-2 text-meta text-muted">
      <template v-if="isLive">
        <span aria-hidden="true" class="inline-block size-2 rounded-full bg-accent"></span>
        <span>{{ $t('ticket.liveOn') }}</span>
      </template>
      <span v-else>{{ $t('ticket.liveOff') }}</span>
    </p>
  </section>
</template>
