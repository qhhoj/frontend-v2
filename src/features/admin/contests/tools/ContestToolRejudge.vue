<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { EditableContest } from '@/api/types/contest-editing';
import Notice from '@/components/ui/Notice.vue';
import { usePermissions } from '@/stores/use-permissions';
import BatchActionDialogs from '../../rejudge/BatchActionDialogs.vue';
import RejudgeFilterForm from '../../rejudge/RejudgeFilterForm.vue';
import {
  checkContestScope,
  contestScopedFilter,
  describeRejudgeFilter,
  emptyRejudgeFilter,
  toRejudgeBody,
} from '../../rejudge/rejudge-filter';
import type { ContestRejudgeScope, RejudgeFilter } from '../../rejudge/rejudge-filter';
import type { RejudgeOutcome } from '../../rejudge/use-bulk-rejudge';
import type { FieldErrors } from '../../ui/admin-errors';
import { needsPermissionText } from '../../ui/permission-text';

/**
 * Rejudge inside this contest: one problem, one contestant or all of it, optionally only some verdicts. The form and
 * the dialog are the rejudge screen's own (one implementation); here the contest is pinned. A click never rejudges: it
 * opens the dialog, which counts with a dry run and shows a sample before its button (with the count) can be pressed.
 */
const props = defineProps<{ contest: EditableContest }>();
const KEY = 'admin.contests.workbench.tools.rejudge';
const { t } = useI18n();
const { can } = usePermissions();
const filter = ref<RejudgeFilter>(emptyRejudgeFilter());
const scope = ref<ContestRejudgeScope>('problem');
const errors = ref<FieldErrors>({});
const outcome = ref<RejudgeOutcome | null>(null);
const dialogs = useTemplateRef('dialogs');

const problems = computed(() => props.contest.problems ?? []);
/** What is sent: the contest and the chosen scope's own field, whatever was typed under another scope. */
const scoped = computed(() => contestScopedFilter(filter.value, props.contest.key, scope.value));
const body = computed(() => toRejudgeBody(scoped.value));
const line = computed(() => t(`${KEY}.line`, { ...describeRejudgeFilter(scoped.value, []) }));

function ask() {
  errors.value = checkContestScope(filter.value, scope.value);
  if (Object.keys(errors.value).length === 0) dialogs.value?.open('rejudge');
}
watch(scope, () => (errors.value = {}));
/** A saved problem list can drop the picked problem. */
watch(problems, (listed) => {
  if (!listed.some((entry) => entry.code === filter.value.problem)) filter.value.problem = '';
});
</script>

<template>
  <p v-if="!can('judge.rejudge_submission')" class="m-0 text-meta text-muted">
    {{ needsPermissionText('judge.rejudge_submission') }}
  </p>
  <div v-else class="flex flex-col gap-3" data-testid="contest-tool-rejudge">
    <RejudgeFilterForm
      v-model:filter="filter"
      v-model:scope="scope"
      :languages="[]"
      :errors="errors"
      :contest-problems="problems"
      @rejudge="ask"
    />
    <Notice v-if="outcome" :tone="outcome.kind === 'done' ? 'success' : 'danger'" compact>
      {{ outcome.text }}
    </Notice>
    <BatchActionDialogs
      ref="dialogs"
      :body="body"
      :line="line"
      @outcome="(next) => (outcome = next)"
    />
  </div>
</template>
