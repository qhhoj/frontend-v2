<script setup lang="ts">
import type { TicketDetail } from '@/api/types/tickets';
import UserContent from '@/components/UserContent.vue';
import UserName from '@/components/UserName.vue';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { formatNumericDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

/** The thread. Counts are announced by the page's own region, so this list carries no live region. */
const props = defineProps<{ ticket: TicketDetail; isLive: boolean }>();
const locale = useLocaleStore();
const isAssignee = (username: string) =>
  props.ticket.assignees.some((assignee) => assignee.username === username);
</script>

<template>
  <section :aria-label="$t('ticket.messages')" class="flex flex-col gap-4">
    <article
      v-for="message in ticket.messages"
      :key="message.id"
      class="flex gap-3 rounded-xl border border-line bg-surface p-4"
    >
      <UserAvatar :username="message.author.username" :size="32" />
      <div class="flex min-w-0 flex-1 flex-col gap-2">
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <UserName :username="message.author.username" />
          <span
            v-if="isAssignee(message.author.username)"
            class="rounded-pill bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-soft-text"
          >
            {{ $t('ticket.assigneeChip') }}
          </span>
          <time :datetime="message.createdAt" class="text-[13px] text-muted">
            {{ formatNumericDateTime(message.createdAt, locale.locale) }}
          </time>
        </div>
        <UserContent :html="message.bodyHtml" />
      </div>
    </article>
    <p class="flex items-center gap-2 text-[13px] text-muted">
      <template v-if="isLive">
        <span aria-hidden="true" class="inline-block size-2 rounded-full bg-accent"></span>
        <span>{{ $t('ticket.liveOn') }}</span>
      </template>
      <span v-else>{{ $t('ticket.liveOff') }}</span>
    </p>
  </section>
</template>
