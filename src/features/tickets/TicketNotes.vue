<script setup lang="ts">
import { ref, watch } from 'vue';
import type { TicketDetail } from '@/api/types/tickets';
import GlassCard from '@/components/GlassCard.vue';
import AppButton from '@/components/ui/AppButton.vue';
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
          class="rounded-cell border border-line-control bg-surface px-3.5 py-2.5 text-base text-content"
          @input="isEdited = true"
        />
      </label>
      <div class="flex justify-end">
        <AppButton type="submit" tone="primary" :loading="isPending">
          {{ $t('common.save') }}
        </AppButton>
      </div>
    </form>
    <p v-else class="whitespace-pre-wrap text-sm">{{ ticket.notes || $t('ticket.noNotes') }}</p>
    <p class="text-meta text-muted">{{ $t('ticket.notesHint') }}</p>
    <p v-if="failureKey" role="alert" class="text-meta text-negative">
      {{ $t(failureKey) }}
    </p>
  </GlassCard>
</template>
