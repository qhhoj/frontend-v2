<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { TicketDetail } from '@/api/types/tickets';
import GlassCard from '@/components/GlassCard.vue';
import AppButton from '@/components/ui/AppButton.vue';
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
    <AppButton
      v-if="ticket.can.markGood"
      data-testid="mark-good"
      :tone="ticket.isContributive ? 'primary' : 'secondary'"
      :aria-pressed="ticket.isContributive ? 'true' : 'false'"
      :loading="isPending"
      @click="markGood"
    >
      {{ $t('ticket.markGood') }}
    </AppButton>
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
          class="min-h-11 rounded-cell border border-line-control bg-surface px-3.5 text-base text-content"
          @input="isEdited = true"
        />
      </label>
      <p v-if="isOverLimit" role="alert" class="text-meta text-negative">
        {{ $t('ticket.assigneesMax') }}
      </p>
      <div class="flex justify-end">
        <AppButton type="submit" tone="primary" :disabled="isOverLimit" :loading="isPending">
          {{ $t('ticket.save') }}
        </AppButton>
      </div>
    </form>
    <p v-if="failureKey" role="alert" class="text-meta text-negative">
      {{ $t(failureKey) }}
    </p>
  </GlassCard>
</template>
