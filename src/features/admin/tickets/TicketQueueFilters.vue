<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import type { TicketListQuery } from '@/api/types/tickets';
import { parseUsernames } from '@/features/tickets/ticket-filters';
import { queueLocation, seedQueueQuery, statusOf, withStatus } from './ticket-queue';
import type { QueueStatus } from './ticket-queue';

const props = defineProps<{ filters: TicketListQuery; ticketId: string | null }>();
const router = useRouter();
const STATUSES: { value: QueueStatus; labelKey: string }[] = [
  { value: 'open', labelKey: 'admin.tickets.filters.open' },
  { value: 'closed', labelKey: 'admin.tickets.filters.closed' },
  { value: 'all', labelKey: 'admin.tickets.filters.all' },
];
const creatorText = ref(props.filters.user.join(', '));
const assigneeText = ref(props.filters.assignee.join(', '));
const BUTTON =
  'inline-flex min-h-11 items-center rounded-pill border border-line px-4 font-semibold';
const FIELD = 'flex flex-col gap-1.5 text-sm font-medium';
const INPUT = 'min-h-11 rounded-lg border border-line bg-surface px-3 text-base text-content';

/** Every change writes the whole filter into the URL, with the open ticket kept. */
const show = (next: TicketListQuery) =>
  router.replace({ query: queueLocation(next, props.ticketId) });
const chooseStatus = (status: QueueStatus) => show(withStatus(props.filters, status));
const chooseOwn = (event: Event) =>
  show({ ...props.filters, own: (event.target as HTMLInputElement).checked, page: 1 });
const applyPeople = () =>
  show({
    ...props.filters,
    user: parseUsernames(creatorText.value),
    assignee: parseUsernames(assigneeText.value),
    page: 1,
  });
/** Reset returns to the queue's first-visit view (everyone's open tickets), keeping the open ticket. */
const reset = () =>
  router.replace({
    query: seedQueueQuery(props.ticketId ? { ticket: props.ticketId } : {}),
  });
</script>

<template>
  <form
    class="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4 xl:flex-row xl:flex-wrap xl:items-end xl:gap-x-6 min-[1800px]:flex-col min-[1800px]:items-stretch"
    novalidate
    @submit.prevent="applyPeople"
  >
    <div class="flex items-center justify-between gap-2 xl:basis-full min-[1800px]:basis-auto">
      <h2 class="font-display text-base font-bold">{{ $t('admin.tickets.filters.heading') }}</h2>
      <button type="button" :class="BUTTON" @click="reset">
        {{ $t('admin.tickets.filters.reset') }}
      </button>
    </div>
    <fieldset
      class="flex flex-col gap-1 xl:flex-row xl:gap-4 min-[1800px]:flex-col min-[1800px]:gap-1"
    >
      <legend class="mb-1 text-sm font-semibold">{{ $t('admin.tickets.filters.status') }}</legend>
      <label
        v-for="status in STATUSES"
        :key="status.value"
        class="flex min-h-11 items-center gap-2"
      >
        <input
          type="radio"
          name="status"
          :value="status.value"
          :checked="statusOf(filters) === status.value"
          class="size-5"
          @change="chooseStatus(status.value)"
        />
        {{ $t(status.labelKey) }}
      </label>
    </fieldset>
    <label class="flex min-h-11 items-center gap-2 text-sm font-medium">
      <input type="checkbox" name="own" :checked="filters.own" class="size-5" @change="chooseOwn" />
      {{ $t('admin.tickets.filters.own') }}
    </label>
    <label :class="FIELD">
      {{ $t('admin.tickets.filters.creator') }}
      <input
        v-model="creatorText"
        name="user"
        type="text"
        autocomplete="off"
        :class="INPUT"
        @blur="applyPeople"
      />
    </label>
    <label :class="FIELD">
      {{ $t('admin.tickets.filters.assignee') }}
      <input
        v-model="assigneeText"
        name="assignee"
        type="text"
        autocomplete="off"
        :class="INPUT"
        @blur="applyPeople"
      />
    </label>
    <p class="text-[13px] text-muted xl:basis-full min-[1800px]:basis-auto">
      {{ $t('admin.tickets.filters.peopleHint') }}
    </p>
    <p class="text-[13px] text-muted xl:basis-full min-[1800px]:basis-auto">
      {{ $t('admin.tickets.filters.untaggedNote') }}
    </p>
  </form>
</template>
