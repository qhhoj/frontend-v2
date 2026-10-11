<script setup lang="ts">
import { computed, ref } from 'vue';
import { putEditorial } from '@/api/problem-editing.api';
import type { UserChip } from '@/api/types/admin-common';
import type {
  EditableProblem,
  EditorialDraftBody,
  ProblemEditingMeta,
} from '@/api/types/problem-editing';
import { translate } from '@/i18n';
import AdminStatus from '../../ui/AdminStatus.vue';
import { CARD } from '../../ui/controls';
import AdminCheckbox from '../../ui/form/AdminCheckbox.vue';
import AdminDateTimeField from '../../ui/form/AdminDateTimeField.vue';
import AdminLeaveGuard from '../../ui/form/AdminLeaveGuard.vue';
import AdminSaveBar from '../../ui/form/AdminSaveBar.vue';
import { useDirtyForm } from '../../ui/form/dirty-form';
import MarkdownField from '../../ui/MarkdownField.vue';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import UsernameChips from '../../ui/UsernameChips.vue';
import { failureReasonOf } from '../failure-reason';
import { PUBLIC_PROBLEMS_KEY } from '../problem-editing.queries';
import { markdownError } from '../statements/statement-drafts';

interface EditorialForm {
  isPublic: boolean;
  /** ISO instant; null = publish from the moment it is saved. */
  publishOn: string | null;
  authors: UserChip[];
  content: string;
}

/** Public flag and release time on one row, authors, then the Markdown with its preview; one save bar. */
const props = defineProps<{ problem: EditableProblem; meta: ProblemEditingMeta }>();
const stored = props.problem.editor!.solution;
const { draft, dirtyCount, discard, commit } = useDirtyForm<EditorialForm>({
  isPublic: stored?.isPublic ?? false,
  publishOn: stored?.publishOn ?? null,
  authors: (stored?.authors ?? []).map(({ id, username }) => ({ id, username })),
  content: stored?.content ?? '',
});
const contentError = computed(() => markdownError(draft.value.content));
const savedAt = ref<Date | null>(null);

const mutation = useAdminMutation({
  mutate: (body: EditorialDraftBody) => putEditorial(props.problem.code, body),
  invalidates: () => [['admin', 'problem', props.problem.code], PUBLIC_PROBLEMS_KEY],
  successText: () => translate('admin.problems.editorial.savedToast'),
  onSuccess: () => (savedAt.value = new Date()),
});

async function save() {
  if (contentError.value || dirtyCount.value === 0) return;
  const sent = { ...draft.value, authors: [...draft.value.authors] };
  await mutation.run({
    isPublic: sent.isPublic,
    publishOn: sent.publishOn ?? new Date().toISOString(),
    authors: sent.authors.map((chip) => chip.id),
    content: sent.content,
  });
  if (mutation.isDone.value) commit(sent);
}
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="save">
    <fieldset
      :disabled="mutation.isPending.value"
      :class="[CARD, 'm-0 flex min-w-0 flex-col gap-5 p-4 sm:p-5']"
    >
      <div class="grid gap-4 md:grid-cols-2 md:items-start">
        <AdminCheckbox
          v-model="draft.isPublic"
          class="md:mt-7"
          input-id="editorial-isPublic"
          :label="$t('admin.problems.editorial.public')"
          :description="$t('admin.problems.editorial.publicHint')"
        />
        <AdminDateTimeField
          v-model="draft.publishOn"
          input-id="editorial-publishOn"
          :label="$t('admin.problems.editorial.publishOn')"
          :hint="$t('admin.problems.editorial.publishOnHint')"
        />
      </div>
      <UsernameChips
        v-model="draft.authors"
        class="max-w-xl"
        :label="$t('admin.problems.editorial.authors')"
      />
      <MarkdownField
        v-model="draft.content"
        :label="$t('admin.problems.editorial.content')"
        preview-style="solution"
        :error="contentError"
      />
    </fieldset>
    <AdminStatus
      v-if="mutation.failure.value"
      kind="refused"
      :text="failureReasonOf(mutation.failure.value)"
    />
    <AdminSaveBar
      data-testid="editorial-save-bar"
      :dirty-count="dirtyCount"
      :pending="mutation.isPending.value"
      :saved-at="savedAt"
      :save-label="$t('admin.problems.editorial.save')"
      @discard="discard"
    />
    <AdminLeaveGuard :dirty-count="dirtyCount" />
  </form>
</template>
