<script setup lang="ts">
import { ref } from 'vue';
import { putEditorial } from '@/api/problem-editing.api';
import type { UserChip } from '@/api/types/admin-common';
import type {
  EditableProblem,
  EditorialDraftBody,
  ProblemEditingMeta,
} from '@/api/types/problem-editing';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import AdminBit from '../../shell/AdminBit.vue';
import AdminField from '../../ui/AdminField.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import AdminSwitch from '../../ui/AdminSwitch.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { ADMIN_INPUT_CLASS, ADMIN_PRIMARY_CLASS } from '../../ui/classes';
import { toLocalInput } from '../../ui/datetime';
import MarkdownField from '../../ui/MarkdownField.vue';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import UsernameChips from '../../ui/UsernameChips.vue';
import { publishOnToSend } from './editorial-draft';

const props = defineProps<{ problem: EditableProblem; meta: ProblemEditingMeta }>();
const stored = props.problem.editor!.solution;
const isPublic = ref(stored?.isPublic ?? false);
const publishOnBox = ref(toLocalInput(stored?.publishOn ?? null));
const authors = ref<UserChip[]>(
  (stored?.authors ?? []).map(({ id, username }) => ({ id, username })),
);
const content = ref(stored?.content ?? '');

const mutation = useAdminMutation({
  mutate: (draft: EditorialDraftBody) => putEditorial(props.problem.code, draft),
  invalidates: () => [['admin', 'problem', props.problem.code]],
});

function save() {
  void mutation.run({
    isPublic: isPublic.value,
    publishOn: publishOnToSend(publishOnBox.value, stored?.publishOn ?? null, new Date()),
    authors: authors.value.map((chip) => chip.id),
    content: content.value,
  });
}
</script>

<template>
  <SettingsCard
    :title="$t('admin.problems.editorial.title')"
    :lead="$t('admin.problems.editorial.lead')"
  >
    <template #header-end>
      <AdminBit placement="composing" />
    </template>
    <AdminSwitch
      v-model="isPublic"
      :label="$t('admin.problems.editorial.public')"
      :description="$t('admin.problems.editorial.publicHint')"
    />
    <AdminField
      v-slot="{ id, describedBy }"
      input-id="editorial-publishOn"
      :label="$t('admin.problems.editorial.publishOn')"
      :hint="$t('admin.problems.editorial.publishOnHint')"
    >
      <input
        :id="id"
        v-model="publishOnBox"
        type="datetime-local"
        :class="ADMIN_INPUT_CLASS"
        :aria-describedby="describedBy"
      />
    </AdminField>
    <UsernameChips v-model="authors" :label="$t('admin.problems.editorial.authors')" />
    <MarkdownField
      v-model="content"
      :label="$t('admin.problems.editorial.content')"
      preview-style="solution"
    />
    <div class="flex flex-wrap items-center gap-3">
      <AdminStatus
        v-if="mutation.failure.value"
        kind="refused"
        :text="failureTextOf(mutation.failure.value)"
      />
      <AdminStatus v-else-if="mutation.isDone.value" kind="done" :text="$t('admin.ui.saved')" />
      <button
        type="button"
        class="ml-auto"
        :class="ADMIN_PRIMARY_CLASS"
        :aria-disabled="mutation.isPending.value ? 'true' : undefined"
        @click="save"
      >
        {{ $t('admin.problems.editorial.save') }}
      </button>
    </div>
  </SettingsCard>
</template>
