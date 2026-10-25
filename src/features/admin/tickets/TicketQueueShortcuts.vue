<script setup lang="ts">
import { computed } from 'vue';
import type { TicketListQuery } from '@/api/types/tickets';
import { useTicketSummaryQuery } from '@/features/tickets/tickets.queries';
import { usePermissions } from '@/stores/use-permissions';
import { useSessionStore } from '@/stores/session.store';
import { CONTEST_EDIT_OWN, PROBLEM_EDIT } from '../admin-screens';
import { CHECK_CHIP } from '../ui/controls';
import { isMineOnly, withMineOnly } from './ticket-queue';

/**
 * The two one-click views of the queue: "Phiếu của tôi" (tickets the viewer handles) and, for problem setters and contest organisers,
 * "Về bài của tôi" (tickets about the problems and contests they make), each with its open count.
 */
const props = defineProps<{ filters: TicketListQuery }>();
const emit = defineEmits<{ show: [filters: TicketListQuery] }>();
const session = useSessionStore();
const { can } = usePermissions();
const summary = useTicketSummaryQuery();
const username = computed(() => session.user?.username ?? '');
const isMine = computed(() => isMineOnly(props.filters, username.value));
const setMine = (isOn: boolean) => emit('show', withMineOnly(props.filters, username.value, isOn));
const setAboutMine = (isOn: boolean) =>
  emit('show', { ...props.filters, aboutMine: isOn || undefined, page: 1 });
const checkedOf = (event: Event) => (event.target as HTMLInputElement).checked;
const COUNT = 'rounded-pill bg-surface-strong px-1.5 font-mono text-caption leading-4 tabular-nums';
</script>

<template>
  <label :class="CHECK_CHIP" data-testid="queue-mine">
    <input
      type="checkbox"
      name="mine"
      class="size-4 accent-accent"
      :checked="isMine"
      @change="setMine(checkedOf($event))"
    />
    {{ $t('admin.tickets.filters.mine') }}
    <span v-if="summary.data.value?.assignedOpen" :class="COUNT">{{
      summary.data.value.assignedOpen
    }}</span>
  </label>
  <label
    v-if="can(PROBLEM_EDIT) || can(CONTEST_EDIT_OWN)"
    :class="CHECK_CHIP"
    data-testid="queue-about-mine"
  >
    <input
      type="checkbox"
      name="aboutMine"
      class="size-4 accent-accent"
      :checked="filters.aboutMine === true"
      @change="setAboutMine(checkedOf($event))"
    />
    {{ $t('admin.tickets.filters.aboutMine') }}
    <span v-if="summary.data.value?.aboutMineOpen" :class="COUNT">{{
      summary.data.value.aboutMineOpen
    }}</span>
  </label>
</template>
