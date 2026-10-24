<script setup lang="ts">
import { Lock, LockOpen, Star, StarOff, UserMinus, UserPlus } from 'lucide-vue-next';
import { computed } from 'vue';
import type { Component } from 'vue';
import type { TicketTimelineEvent, TicketTimelineType } from '@/api/types/tickets';
import { translate } from '@/i18n';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { eventTextKey } from './ticket-thread';

/** One state change between the messages (divider row). */
const props = defineProps<{ event: TicketTimelineEvent }>();
const ICONS: Readonly<Record<TicketTimelineType, Component>> = {
  closed: Lock,
  reopened: LockOpen,
  assigned: UserPlus,
  unassigned: UserMinus,
  'marked-good': Star,
  'unmarked-good': StarOff,
};
const locale = useLocaleStore();
const text = computed(() =>
  translate(eventTextKey(props.event.type), {
    actor: props.event.actor.username,
    target: props.event.target?.username ?? '',
  }),
);
</script>

<template>
  <p
    data-testid="ticket-event"
    :data-type="event.type"
    class="m-0 flex flex-wrap items-center gap-2 border-y border-dashed border-line py-2 text-meta text-muted"
  >
    <component :is="ICONS[event.type]" aria-hidden="true" class="size-4 shrink-0" />
    <span class="text-content">{{ text }}</span>
    <time :datetime="event.at">{{ formatDate(event.at, 'datetime', locale.locale) }}</time>
  </p>
</template>
