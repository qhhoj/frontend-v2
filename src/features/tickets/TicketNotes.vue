<script setup lang="ts">
import { ref, watch } from 'vue';
import type { TicketDetail } from '@/api/types/tickets';
import GlassCard from '@/components/GlassCard.vue';
import { useTicketPatch } from './use-ticket-patch';

/** Notes: everyone who reads the ticket sees them; assignees and staff (`can.editNotes`) edit them. */
const props = defineProps<{ ticket: TicketDetail }>();
const draft = ref(props.ticket.notes);
/** Set by typing, cleared once a save is accepted: a refetch never overwrites text the viewer is still working on. */
const isEdited = ref(false);
watch(
  () => props.ticket.notes,
  (notes) => {
    if (!isEdited.value) draft.value = notes;
  },
);
const { isPending, failureKey, patch } = useTicketPatch(props.ticket.id);
const save = () => patch({ notes: draft.value }, () => (isEdited.value = false));
const BUTTON = 'inline-flex min-h-11 items-center rounded-pill px-5 font-semibold';
</script>

<template>
  <GlassCard as="section" class="flex flex-col gap-3 p-5">
    <h2 class="font-display text-base font-bold">
      {{ ticket.can.assign ? $t('ticket.notesInternal') : $t('ticket.notes') }}
    </h2>
    <form v-if="ticket.can.editNotes" class="flex flex-col gap-3" novalidate @submit.prevent="save">
      <label class="flex flex-col gap-1.5 text-sm font-medium">
        <span class="sr-only">{{ $t('ticket.notes') }}</span>
        <textarea
          v-model="draft"
          name="notes"
          rows="5"
          class="rounded-cell border border-line bg-surface px-3.5 py-2.5 text-base text-content"
          @input="isEdited = true"
        />
      </label>
      <div class="flex justify-end">
        <button
          type="submit"
          :aria-busy="isPending ? 'true' : undefined"
          :class="[
            BUTTON,
            isPending
              ? 'cursor-progress bg-accent-soft text-accent-soft-text'
              : 'bg-accent text-on-accent',
          ]"
        >
          {{ $t('ticket.saveNotes') }}
        </button>
      </div>
    </form>
    <p v-else class="whitespace-pre-wrap text-sm">{{ ticket.notes || $t('ticket.noNotes') }}</p>
    <p class="text-[13px] text-muted">{{ $t('ticket.notesHint') }}</p>
    <p v-if="failureKey" role="alert" class="text-[13px] text-negative">
      {{ $t(failureKey) }}
    </p>
  </GlassCard>
</template>
