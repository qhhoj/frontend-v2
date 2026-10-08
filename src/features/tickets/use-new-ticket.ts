import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { computed, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { LocationQuery, LocationQueryValue } from 'vue-router';
import { useRouter, useRoute } from 'vue-router';
import { createGeneralTicket, createProblemTicket } from '@/api/tickets.api';
import { draftIssues } from './ticket-draft';
import type { DraftIssue, TicketDraft } from './ticket-draft';
import { submitFailureOf } from './ticket-submit';
import type { SubmitFailure } from './ticket-submit';
import { useProblemLookup } from './use-problem-lookup';

const firstText = (value: LocationQueryValue | LocationQueryValue[] | undefined) => {
  const text = Array.isArray(value) ? value[0] : value;
  return typeof text === 'string' ? text.trim() : '';
};

/** A new draft; `?problem=<code>` preselects the problem kind and fills its code. */
const draftFromRoute = (query: LocationQuery): TicketDraft => ({
  kind: 'problem',
  problemCode: firstText(query.problem),
  title: '',
  body: '',
  issueUrl: '',
});

const sendTicket = (values: TicketDraft) => {
  const title = values.title.trim();
  const body = values.body.trim();
  return values.kind === 'general'
    ? createGeneralTicket({ title, body, issueUrl: values.issueUrl.trim() })
    : createProblemTicket(values.problemCode.trim(), { title, body });
};

/** Files the draft, then opens the ticket it made. A corrected problem code clears the server's "no such problem" answer. */
function useFileTicket(draft: TicketDraft) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: sendTicket,
    onSuccess: async (ticket) => {
      void queryClient.invalidateQueries({ queryKey: ['tickets'] });
      await router.push({ name: 'ticket', params: { id: ticket.id }, state: { ticketSent: true } });
    },
  });
  watch(
    () => draft.problemCode,
    () => {
      if (mutation.error.value && submitFailureOf(mutation.error.value, 'problem').kind === 'field')
        mutation.reset();
    },
  );
  return mutation;
}

/** The messages a field shows: its own problems once a submit was tried, and the server's answer for a field. */
const fieldIssuesOf = (
  draft: TicketDraft,
  attempted: boolean,
  failure: SubmitFailure | null,
): DraftIssue[] => [
  ...(attempted ? draftIssues(draft) : []),
  ...(failure?.kind === 'field' ? [failure.issue] : []),
];

/** The new-ticket form: the draft (prefilled from `?problem=`), its problem lookup, and the submit that opens the new ticket. */
export function useNewTicket(form: Ref<HTMLFormElement | null>) {
  const route = useRoute();
  const draft = reactive<TicketDraft>(draftFromRoute(route.query));
  const lookup = useProblemLookup(
    computed(() => (draft.kind === 'problem' ? draft.problemCode : '')),
  );
  const attempted = ref(false);
  const mutation = useFileTicket(draft);

  const failure = computed<SubmitFailure | null>(() =>
    mutation.error.value ? submitFailureOf(mutation.error.value, draft.kind) : null,
  );
  const panelFailure = computed(() => (failure.value?.kind === 'panel' ? failure.value : null));
  const issueKeyOf = (field: keyof TicketDraft) =>
    fieldIssuesOf(draft, attempted.value, failure.value).find((issue) => issue.field === field)
      ?.key;

  const focusField = (field: keyof TicketDraft) =>
    form.value?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
  const submit = () => {
    if (mutation.isPending.value) return;
    attempted.value = true;
    const [firstIssue] = draftIssues(draft);
    if (firstIssue) return focusField(firstIssue.field);
    mutation.mutate({ ...draft });
  };

  return {
    draft,
    problemName: lookup.name,
    problemMissing: lookup.isMissing,
    panelFailure,
    isPending: mutation.isPending,
    issueKeyOf,
    submit,
  };
}
