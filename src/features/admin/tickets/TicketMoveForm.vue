<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { ref } from 'vue';
import { updateTicket } from '@/api/tickets.api';
import type { TicketDetail, TicketPatch } from '@/api/types/tickets';
import { TICKET_TITLE_MAX_LENGTH } from '@/api/types/tickets';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { ADMIN_BUTTON_CLASS, ADMIN_INPUT_CLASS } from '../ui/classes';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { movePatchOf } from './ticket-queue';

/** Staff retitle a ticket or link it to another problem (legacy `TicketAdmin`); only changed fields are sent. */
const props = defineProps<{ ticket: TicketDetail }>();
const queryClient = useQueryClient();
const title = ref(props.ticket.title);
const problem = ref(props.ticket.link.type === 'problem' ? (props.ticket.link.key ?? '') : '');

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
  <form
    class="flex flex-col gap-3 rounded-xl border border-line p-4"
    novalidate
    @submit.prevent="submit"
  >
    <h3 class="font-display text-base font-bold">{{ $t('admin.tickets.move.heading') }}</h3>
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
        :class="ADMIN_INPUT_CLASS"
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
        :class="[ADMIN_INPUT_CLASS, 'font-mono']"
        :aria-describedby="describedBy"
      />
    </AdminField>
    <div class="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        :class="ADMIN_BUTTON_CLASS"
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
</template>
