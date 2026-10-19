<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue';
import Card from '@/components/ui/Card.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import TicketLinkChip from '@/features/tickets/TicketLinkChip.vue';
import TicketMessages from '@/features/tickets/TicketMessages.vue';
import TicketReply from '@/features/tickets/TicketReply.vue';
import { cannedContextOf } from '@/features/tickets/canned/canned-text';
import TicketStatusPill from '@/features/tickets/TicketStatusPill.vue';
import { useTicketPatch } from '@/features/tickets/use-ticket-patch';
import { useTicketQuery } from '@/features/tickets/tickets.queries';
import { useTicketStream } from '@/features/tickets/use-ticket-stream';
import { formatDate } from '@/lib/format-date';
import { useBottomScrollPadding } from '@/lib/use-bottom-scroll-padding';
import { useLocaleStore } from '@/stores/locale.store';
import { buttonClass } from '../ui/controls';
import TicketClaimButton from './TicketClaimButton.vue';
import TicketHandlingSection from './TicketHandlingSection.vue';
import TicketMarkGood from './TicketMarkGood.vue';

/**
 * The open ticket beside the list (P-31): claim, close and "good contribution" in the header, the folded "Xử lý"
 * section, the thread, and the reply box kept at the bottom of the screen while the thread scrolls (from tablet width;
 * on a phone it would hide the thread). Pinned, the box is one compact row until used, the page's scroll padding keeps
 * focused fields above it, and opening a ticket scrolls its newest message into view above it. Mounted (keyed) once
 * per open ticket, so its live feed closes with it.
 */
const props = defineProps<{ ticketId: string }>();
const locale = useLocaleStore();
const { data: ticket, error, isPending, refetch } = useTicketQuery(props.ticketId);
const { isLive, announcement } = useTicketStream(props.ticketId);
const { isPending: isSaving, failureKey, patch } = useTicketPatch(props.ticketId);
const closeAfterReply = ref(false);

const replyBox = useTemplateRef<HTMLElement>('replyBox');
const isPinned = (box: HTMLElement) => getComputedStyle(box).position === 'sticky';
useBottomScrollPadding(replyBox, isPinned);
/** Once, when the ticket first shows: its newest message, not the reply box, is what the handler reads first. */
let isRevealed = false;
watch(
  () => ticket.value?.id,
  (id) => {
    const box = replyBox.value;
    if (isRevealed || !id || !box || !isPinned(box)) return;
    isRevealed = true;
    const messages = box.parentElement?.querySelectorAll('[data-testid="ticket-message"]') ?? [];
    messages[messages.length - 1]?.scrollIntoView({ block: 'nearest' });
  },
  { immediate: true, flush: 'post' },
);

/** The reply went through; with the box checked, the ticket closes too, one PATCH after the message. */
const onSent = () => {
  if (closeAfterReply.value) patch({ isOpen: false }, () => (closeAfterReply.value = false));
};
const toggleOpen = () => {
  if (ticket.value) patch({ isOpen: !ticket.value.isOpen });
};
const toggleGood = () => {
  if (ticket.value) patch({ isContributive: !ticket.value.isContributive });
};
</script>

<template>
  <Card variant="flat" padding="md" data-testid="queue-detail" class="flex min-w-0 flex-col gap-5">
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><SkeletonBlock class="h-96 w-full" /></template>
      <template v-if="ticket">
        <header class="flex flex-col gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <TicketStatusPill :is-open="ticket.isOpen" :is-contributive="ticket.isContributive" />
            <TicketLinkChip :link="ticket.link" />
          </div>
          <h2 class="section-title">{{ ticket.title }}</h2>
          <p class="text-meta text-muted">
            {{
              $t('admin.tickets.detail.byline', {
                creator: ticket.creator.username,
                date: formatDate(ticket.createdAt, 'datetime', locale.locale),
              })
            }}
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <TicketClaimButton :ticket="ticket" />
            <button
              type="button"
              data-testid="toggle-status"
              :class="buttonClass()"
              :aria-busy="isSaving ? 'true' : undefined"
              @click="toggleOpen"
            >
              {{
                ticket.isOpen ? $t('admin.tickets.detail.close') : $t('admin.tickets.detail.reopen')
              }}
            </button>
            <TicketMarkGood
              v-if="ticket.can.markGood"
              :is-contributive="ticket.isContributive"
              :busy="isSaving"
              @toggle="toggleGood"
            />
          </div>
        </header>
        <p v-if="failureKey" role="alert" class="text-meta text-negative">
          {{ $t(failureKey) }}
        </p>
        <TicketHandlingSection :ticket="ticket" />
        <TicketMessages :ticket="ticket" :is-live="isLive" />
        <div
          ref="replyBox"
          data-testid="queue-reply"
          class="-mx-1 bg-surface-solid px-1 pb-1 md:sticky md:bottom-0 md:z-sticky"
        >
          <TicketReply
            :ticket-id="ticket.id"
            compact
            :canned-context="ticket.can.assign ? cannedContextOf(ticket) : null"
            @sent="onSent"
          >
            <template #options>
              <label class="flex min-h-11 items-center gap-2 text-sm font-medium">
                <input
                  id="close-after-reply"
                  v-model="closeAfterReply"
                  type="checkbox"
                  class="size-5"
                />
                {{ $t('admin.tickets.detail.closeAfterReply') }}
              </label>
            </template>
          </TicketReply>
        </div>
        <p class="sr-only" aria-live="polite">{{ announcement }}</p>
      </template>
    </QueryState>
  </Card>
</template>
