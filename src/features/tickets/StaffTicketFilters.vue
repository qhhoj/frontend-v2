<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { TicketListQuery } from '@/api/types/tickets';
import FormField from '@/components/ui/FormField.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { hasPermission } from '@/lib/permissions';
import { useSessionStore } from '@/stores/session.store';
import { parseUsernames, routeQueryFromFilters } from './ticket-filters';

/** Creator and assignee filters for holders of `judge.change_ticket` (the backend's staff rule); they apply on Enter and on blur. */
const CHANGE_TICKET = 'judge.change_ticket';
const props = defineProps<{ filters: TicketListQuery }>();
const session = useSessionStore();
const canFilterByPeople = computed(() => hasPermission(session.user, CHANGE_TICKET));
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
</script>

<template>
  <form v-if="canFilterByPeople" class="grid gap-3 sm:grid-cols-2" @submit.prevent="apply">
    <p class="text-meta text-muted sm:col-span-2">{{ $t('tickets.staffFilters') }}</p>
    <FormField :label="$t('tickets.creator')">
      <TextInput v-model="creatorText" name="user" type="text" @blur="apply" />
    </FormField>
    <FormField :label="$t('tickets.assignee')">
      <TextInput v-model="assigneeText" name="assignee" type="text" @blur="apply" />
    </FormField>
  </form>
</template>
