<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { ChevronDown } from 'lucide-vue-next';
import { computed, reactive, watch } from 'vue';
import { updateTicket } from '@/api/tickets.api';
import type { TicketDetail, TicketPatch } from '@/api/types/tickets';
import { TICKET_TITLE_MAX_LENGTH } from '@/api/types/tickets';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { INPUT, buttonClass } from '../ui/controls';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { TICKET_ASSIGNEES_MAX, assigneeNamesOf, handlingPatchOf } from './ticket-queue';
import type { HandlingDraft } from './ticket-queue';

/**
 * "Xử lý": handlers, internal notes, title and linked problem in one fold with one save, which sends only the
 * fields that changed. Folded by default; the summary line names the handlers.
 */
const props = defineProps<{ ticket: TicketDetail }>();
const queryClient = useQueryClient();
const stored = (ticket: TicketDetail): HandlingDraft => ({
  assignees: ticket.assignees.map((assignee) => assignee.username).join(', '),
  notes: ticket.notes,
  title: ticket.title,
  problem: ticket.link.type === 'problem' ? (ticket.link.key ?? '') : '',
});
const draft = reactive(stored(props.ticket));
/** Another staff member's change shows in a field this form has not touched, so saving never reverts it. */
watch(
  () => stored(props.ticket),
  (next, previous) => {
    for (const key of Object.keys(next) as (keyof HandlingDraft)[])
      if (draft[key] === previous[key]) draft[key] = next[key];
  },
);
const canEdit = computed(() => props.ticket.can.assign || props.ticket.can.editNotes);
const isOverLimit = computed(() => assigneeNamesOf(draft.assignees).length > TICKET_ASSIGNEES_MAX);
const handlerNames = computed(() => stored(props.ticket).assignees);
const save = useAdminMutation({
  mutate: (patch: TicketPatch) => updateTicket(props.ticket.id, patch),
  // Once the refetch lands the fields show what was stored (the backend may reorder or respell the handlers).
  onDone: () =>
    void queryClient
      .invalidateQueries({ queryKey: ['tickets'] })
      .then(() => Object.assign(draft, stored(props.ticket))),
});
const isUnchanged = computed(() => handlingPatchOf(props.ticket, draft) === null);
function submit() {
  const patch = handlingPatchOf(props.ticket, draft);
  if (patch && !isOverLimit.value) void save.run(patch);
}
const hasFieldErrors = computed(() => Object.keys(save.fieldErrors.value).length > 0);
</script>

<template>
  <details
    data-testid="ticket-handling"
    class="group rounded-row border border-line bg-surface-solid open:pb-4"
  >
    <summary
      class="flex min-h-11 cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 [&::-webkit-details-marker]:hidden"
    >
      <ChevronDown
        aria-hidden="true"
        class="size-4 shrink-0 -rotate-90 text-muted transition-transform group-open:rotate-0"
        :stroke-width="1.75"
      />
      <span class="font-display text-base font-semibold">{{
        $t('admin.tickets.handling.heading')
      }}</span>
      <span class="min-w-0 truncate text-meta text-muted">
        {{ handlerNames || $t('admin.tickets.table.unassigned') }}
      </span>
    </summary>
    <form v-if="canEdit" class="flex flex-col gap-4 px-4" novalidate @submit.prevent="submit">
      <AdminField
        v-if="ticket.can.assign"
        v-slot="{ id, describedBy }"
        :label="$t('admin.tickets.handling.assignees')"
        :hint="$t('admin.tickets.handling.assigneesHint')"
        :error="
          isOverLimit ? $t('admin.tickets.handling.assigneesMax') : save.fieldErrors.value.assignees
        "
      >
        <input
          :id="id"
          v-model="draft.assignees"
          name="assignees"
          autocomplete="off"
          spellcheck="false"
          :class="INPUT"
          :aria-describedby="describedBy"
          :aria-invalid="isOverLimit || undefined"
        />
      </AdminField>
      <AdminField
        v-if="ticket.can.editNotes"
        v-slot="{ id, describedBy }"
        :label="$t('admin.tickets.handling.notes')"
        :hint="$t('admin.tickets.handling.notesHint')"
        :error="save.fieldErrors.value.notes"
      >
        <textarea
          :id="id"
          v-model="draft.notes"
          name="notes"
          rows="4"
          :class="[INPUT, 'h-auto py-2']"
          :aria-describedby="describedBy"
        />
      </AdminField>
      <template v-if="ticket.can.assign">
        <AdminField
          v-slot="{ id, describedBy }"
          :label="$t('admin.tickets.handling.title')"
          :error="save.fieldErrors.value.title"
        >
          <input
            :id="id"
            v-model="draft.title"
            name="title"
            :maxlength="TICKET_TITLE_MAX_LENGTH"
            autocomplete="off"
            :class="INPUT"
            :aria-describedby="describedBy"
          />
        </AdminField>
        <AdminField
          v-slot="{ id, describedBy }"
          :label="$t('admin.tickets.handling.problem')"
          :hint="$t('admin.tickets.handling.problemHint')"
          :error="save.fieldErrors.value.problem"
        >
          <input
            :id="id"
            v-model="draft.problem"
            name="problem"
            autocomplete="off"
            spellcheck="false"
            :class="[INPUT, 'font-mono']"
            :aria-describedby="describedBy"
          />
        </AdminField>
      </template>
      <div class="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          data-testid="handling-save"
          :class="buttonClass('secondary')"
          :aria-disabled="isUnchanged || isOverLimit || save.isPending.value || undefined"
          :aria-busy="save.isPending.value || undefined"
        >
          {{ $t('common.save') }}
        </button>
        <AdminStatus
          v-if="save.isDone.value && isUnchanged"
          kind="done"
          :text="$t('admin.tickets.handling.saved')"
        />
        <AdminStatus
          v-else-if="save.failure.value && !hasFieldErrors"
          kind="refused"
          :text="failureTextOf(save.failure.value)"
        />
      </div>
    </form>
    <div v-else class="flex flex-col gap-1 px-4">
      <h3 class="text-sm font-semibold">{{ $t('ticket.notes') }}</h3>
      <p class="m-0 text-sm whitespace-pre-wrap">{{ ticket.notes || $t('ticket.noNotes') }}</p>
    </div>
  </details>
</template>
