<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import type { TicketListQuery } from '@/api/types/tickets';
import { useSessionStore } from '@/stores/session.store';
import { parseUsernames, routeQueryFromFilters } from './ticket-filters';

/** Creator and assignee filters for staff only; they apply on Enter and when the field loses focus. */
const props = defineProps<{ filters: TicketListQuery }>();
const session = useSessionStore();
const router = useRouter();
const creatorText = ref(props.filters.user.join(', '));
const assigneeText = ref(props.filters.assignee.join(', '));

const apply = () =>
  router.push({
    name: 'tickets',
    query: routeQueryFromFilters({
      ...props.filters,
      user: parseUsernames(creatorText.value),
      assignee: parseUsernames(assigneeText.value),
      page: 1,
    }),
  });
const FIELD = 'flex flex-col gap-1.5 text-sm font-medium';
const INPUT = 'min-h-11 rounded-lg border border-line bg-surface px-3 text-base text-content';
</script>

<template>
  <form v-if="session.isStaff" class="grid gap-3 sm:grid-cols-2" @submit.prevent="apply">
    <p class="text-[13px] text-muted sm:col-span-2">{{ $t('tickets.staffFilters') }}</p>
    <label :class="FIELD">
      {{ $t('tickets.creator') }}
      <input v-model="creatorText" name="user" type="text" :class="INPUT" @blur="apply" />
    </label>
    <label :class="FIELD">
      {{ $t('tickets.assignee') }}
      <input v-model="assigneeText" name="assignee" type="text" :class="INPUT" @blur="apply" />
    </label>
  </form>
</template>
