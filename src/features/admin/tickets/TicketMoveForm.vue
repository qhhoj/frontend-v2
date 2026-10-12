<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { ref, watch } from 'vue';
import { updateTicket } from '@/api/tickets.api';
import Card from '@/components/ui/Card.vue';
import type { TicketDetail, TicketPatch } from '@/api/types/tickets';
import { TICKET_TITLE_MAX_LENGTH } from '@/api/types/tickets';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { INPUT, buttonClass } from '../ui/controls';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { movePatchOf } from './ticket-queue';

/** Staff retitle a ticket or link it to another problem (legacy `TicketAdmin`); only changed fields are sent. */
const props = defineProps<{ ticket: TicketDetail }>();
const queryClient = useQueryClient();
const problemOf = (ticket: TicketDetail) =>
  ticket.link.type === 'problem' ? (ticket.link.key ?? '') : '';
const title = ref(props.ticket.title);
const problem = ref(problemOf(props.ticket));
/** Another staff member's change shows in a field this form has not touched, so saving never reverts it. */
watch(
  () => props.ticket.title,
  (next, previous) => {
    if (title.value === previous) title.value = next;
  },
);
watch(
  () => problemOf(props.ticket),
  (next, previous) => {
    if (problem.value === previous) problem.value = next;
  },
);

const save = useAdminMutation({
  mutate: (patch: TicketPatch) => updateTicket(props.ticket.id, patch),
  onDone: () => void queryClient.invalidateQueries({ queryKey: ['tickets'] }),
});
function submit() {
  const patch = movePatchOf(props.ticket, { title: title.value, problem: problem.value });
  if (patch) void save.run(patch);
}
</script>

<template>
  <Card variant="flat" padding="md" class="flex flex-col gap-4">
    <h3 class="font-display text-base font-bold">{{ $t('admin.tickets.move.heading') }}</h3>
    <form class="flex flex-col gap-3" novalidate @submit.prevent="submit">
      <AdminField
        v-slot="{ id, describedBy }"
        :label="$t('admin.tickets.move.title')"
        :error="save.fieldErrors.value.title"
      >
        <input
          :id="id"
          v-model="title"
          :maxlength="TICKET_TITLE_MAX_LENGTH"
          autocomplete="off"
          :class="INPUT"
          :aria-describedby="describedBy"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy }"
        :label="$t('admin.tickets.move.problem')"
        :hint="$t('admin.tickets.move.problemHint')"
        :error="save.fieldErrors.value.problem"
      >
        <input
          :id="id"
          v-model="problem"
          autocomplete="off"
          spellcheck="false"
          :class="[INPUT, 'font-mono']"
          :aria-describedby="describedBy"
        />
      </AdminField>
      <div class="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          :class="buttonClass()"
          :aria-disabled="save.isPending.value || undefined"
        >
          {{ $t('admin.tickets.move.save') }}
        </button>
        <AdminStatus v-if="save.isDone.value" kind="done" :text="$t('admin.tickets.move.saved')" />
        <AdminStatus
          v-else-if="save.failure.value && !Object.keys(save.fieldErrors.value).length"
          kind="refused"
          :text="failureTextOf(save.failure.value)"
        />
      </div>
    </form>
  </Card>
</template>
