<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { TicketDetail } from '@/api/types/tickets';
import GlassCard from '@/components/GlassCard.vue';
import { useTicketPatch } from './use-ticket-patch';

/** The backend's `TICKET_ASSIGNEES_MAX`. */
const ASSIGNEES_MAX = 20;
const props = defineProps<{ ticket: TicketDetail }>();
const currentNames = () => props.ticket.assignees.map((assignee) => assignee.username).join(', ');
const assigneesText = ref(currentNames());
/** Set by typing, cleared once a save is accepted: a refetch never overwrites a list being edited. */
const isEdited = ref(false);
watch(currentNames, (names) => {
  if (!isEdited.value) assigneesText.value = names;
});
const { isPending, failureKey, patch } = useTicketPatch(props.ticket.id);
const assigneeNames = computed(() => splitUsernames(assigneesText.value));
const isOverLimit = computed(() => assigneeNames.value.length > ASSIGNEES_MAX);
const BUTTON = 'inline-flex min-h-11 items-center rounded-pill px-5 font-semibold';

/** Usernames typed separated by commas or spaces, each once; unlike the list filter, the limit is the backend's 20. */
function splitUsernames(text: string): string[] {
  return [...new Set(text.split(/[\s,]+/).filter(Boolean))];
}
const saveAssignees = () => {
  if (isOverLimit.value) return;
  patch({ assignees: assigneeNames.value }, () => (isEdited.value = false));
};
const markGood = () => patch({ isContributive: !props.ticket.isContributive });
</script>

<template>
  <GlassCard as="section" class="flex flex-col gap-4 p-5">
    <h2 class="font-display text-base font-bold">{{ $t('ticket.handle') }}</h2>
    <button
      v-if="ticket.can.markGood"
      type="button"
      data-testid="mark-good"
      :aria-pressed="ticket.isContributive ? 'true' : 'false'"
      :aria-busy="isPending ? 'true' : undefined"
      class="inline-flex min-h-11 items-center justify-center rounded-pill border border-line px-5 font-semibold hover:bg-surface-hover"
      :class="ticket.isContributive ? 'bg-accent-soft text-accent-soft-text' : ''"
      @click="markGood"
    >
      {{ $t('ticket.markGood') }}
    </button>
    <form
      v-if="ticket.can.assign"
      data-testid="assignees-form"
      class="flex flex-col gap-2"
      novalidate
      @submit.prevent="saveAssignees"
    >
      <label class="flex flex-col gap-1.5 text-sm font-medium">
        {{ $t('ticket.assigneesInput') }}
        <input
          v-model="assigneesText"
          name="assignees"
          type="text"
          autocomplete="off"
          class="min-h-11 rounded-lg border border-line bg-surface px-3.5 text-base text-content"
          @input="isEdited = true"
        />
      </label>
      <p v-if="isOverLimit" role="alert" class="text-[13px] text-negative">
        {{ $t('ticket.assigneesMax') }}
      </p>
      <div class="flex justify-end">
        <button
          type="submit"
          :aria-disabled="isOverLimit ? 'true' : undefined"
          :aria-busy="isPending ? 'true' : undefined"
          :class="[
            BUTTON,
            isPending
              ? 'cursor-progress bg-accent-soft text-accent-soft-text'
              : 'bg-accent text-on-accent',
          ]"
        >
          {{ $t('ticket.save') }}
        </button>
      </div>
    </form>
    <p v-if="failureKey" role="alert" class="text-[13px] text-negative">
      {{ $t(failureKey) }}
    </p>
  </GlassCard>
</template>
