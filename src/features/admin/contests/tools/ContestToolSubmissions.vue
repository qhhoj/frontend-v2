<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchContestSubmissions } from '@/api/contests.api';
import type { EditableContest } from '@/api/types/contest-editing';
import type { RejudgeBody } from '@/api/types/submission-actions';
import type { SubmissionListQuery } from '@/api/types/submissions';
import EmptyState from '@/components/EmptyState.vue';
import QueryState from '@/components/QueryState.vue';
import AppButton from '@/components/ui/AppButton.vue';
import BulkBar from '@/components/ui/BulkBar.vue';
import Notice from '@/components/ui/Notice.vue';
import PageSection from '@/components/ui/PageSection.vue';
import SearchInput from '@/components/ui/SearchInput.vue';
import SelectField from '@/components/ui/SelectField.vue';
import Toolbar from '@/components/ui/Toolbar.vue';
import SubmissionTable from '@/features/submissions/SubmissionTable.vue';
import SubmissionTableSkeleton from '@/features/submissions/SubmissionTableSkeleton.vue';
import { scopeQueryKey } from '@/features/submissions/list/submission-scope';
import { useInFlightPoll } from '@/features/submissions/list/use-in-flight-poll';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import { useViewerId } from '@/stores/use-viewer-id';
import BatchActionDialogs from '../../rejudge/BatchActionDialogs.vue';
import type { RejudgeOutcome } from '../../rejudge/use-bulk-rejudge';
import { STAFF_ICONS } from '../../ui/staff-action-icons';

/**
 * The contest's newest submissions in the site's one submission table. They come from the contest's own list: the
 * staff list cannot filter by contest, and an editor gets every contestant's rows here. Filters: one problem, one
 * contestant (both asked of the server). Ticked rows go to the one rejudge dialog as `{ contest, ids }`, so the batch
 * needs edit rights on this contest and nothing site-wide. The full list is the contest's public submissions page.
 */
const props = defineProps<{ contest: EditableContest }>();
const KEY = 'admin.contests.workbench.tools.submissions';
const NEWEST_COUNT = 20;
const ALL_PROBLEMS = '';
const { t } = useI18n();
const { can } = usePermissions();
const locale = useLocaleStore();
const viewer = useViewerId();
const dialogs = useTemplateRef('dialogs');

const problem = ref(ALL_PROBLEMS);
const typedUser = ref('');
const user = ref('');
const applyUser = () => (user.value = typedUser.value.trim());
/** An emptied box clears the filter at once; a typed name waits for Enter or for leaving the box. */
watch(typedUser, (text) => text === '' && applyUser());

const problems = computed(() => props.contest.problems ?? []);
const problemOptions = computed(() => [
  { value: ALL_PROBLEMS, label: t(`${KEY}.allProblems`) },
  ...problems.value.map((entry) => ({
    value: entry.code,
    label: `${entry.label} · ${entry.name}`,
  })),
]);
const problemLabels = computed(() =>
  Object.fromEntries(problems.value.map((entry) => [entry.code, entry.label])),
);
const contestPoints = computed(() =>
  Object.fromEntries(problems.value.map((entry) => [entry.code, entry.points])),
);

const apiQuery = computed<SubmissionListQuery>(() => ({
  problem: problem.value || undefined,
  user: user.value || undefined,
  page: 1,
  pageSize: NEWEST_COUNT,
}));
const scope = computed(() => ({
  kind: 'contest' as const,
  key: props.contest.key,
  fixedUser: null,
}));
const list = useQuery({
  queryKey: computed(() => scopeQueryKey(scope.value, viewer.value, apiQuery.value)),
  queryFn: () => fetchContestSubmissions(props.contest.key, apiQuery.value),
  placeholderData: (previous) => previous,
});
const rows = computed(() => list.data.value?.items ?? []);
const total = computed(() => list.data.value?.meta.total ?? 0);
/** Rows still being judged are read again until they finish (the list has no feed of its own). */
useInFlightPoll({
  rows,
  enabled: computed(() => true),
  refetchRows: async () => (await list.refetch()).data?.items,
});

const picked = ref<string[]>([]);
const canRejudge = computed(() => can('judge.rejudge_submission'));
const togglePick = (id: string) => {
  picked.value = picked.value.includes(id)
    ? picked.value.filter((pickedId) => pickedId !== id)
    : [...picked.value, id];
};
const isAllPicked = computed(
  () => rows.value.length > 0 && rows.value.every((row) => picked.value.includes(row.id)),
);
const pickAll = () => (picked.value = rows.value.map((row) => row.id));
/** A row that left the shown list (a new filter, newer submissions) leaves the selection: only shown rows are sent. */
watch(rows, (shown) => {
  const shownIds = new Set(shown.map((row) => row.id));
  if (picked.value.some((id) => !shownIds.has(id)))
    picked.value = picked.value.filter((id) => shownIds.has(id));
});

const body = computed<RejudgeBody>(() => ({ contest: props.contest.key, ids: picked.value }));
const line = computed(() => t(`${KEY}.bulkLine`, { count: picked.value.length }));
const outcome = ref<RejudgeOutcome | null>(null);
/** A refusal keeps the selection, so the teacher can retry without ticking the rows again. */
function showOutcome(next: RejudgeOutcome) {
  outcome.value = next;
  if (next.kind === 'done') picked.value = [];
}

const fullListTo = computed(() => ({
  name: 'contest-submissions',
  params: { key: props.contest.key },
  query: {
    ...(problem.value && { problem: problem.value }),
    ...(user.value && { user: user.value }),
  },
}));
const countText = computed(() =>
  t(`${KEY}.shown`, {
    shown: formatNumber(rows.value.length, locale.locale),
    total: formatNumber(total.value, locale.locale),
  }),
);
</script>

<template>
  <PageSection
    :title="$t(`${KEY}.title`)"
    :count="list.data.value ? countText : undefined"
    :see-all="{ to: fullListTo, label: $t(`${KEY}.seeAll`) }"
    data-testid="contest-tool-submissions"
  >
    <div class="flex flex-col gap-3">
      <Toolbar>
        <template #left>
          <SelectField
            v-model="problem"
            data-testid="tool-problem-filter"
            :prefix="$t(`${KEY}.problem`)"
            :options="problemOptions"
            :active="problem !== ALL_PROBLEMS"
          />
          <form class="min-w-60 flex-1 sm:max-w-xs" @submit.prevent="applyUser" @change="applyUser">
            <SearchInput
              v-model="typedUser"
              data-testid="tool-user-filter"
              :label="$t(`${KEY}.user`)"
              :placeholder="$t(`${KEY}.userPlaceholder`)"
            />
          </form>
          <AppButton
            v-if="canRejudge && rows.length > 0 && !isAllPicked"
            tone="quiet"
            size="sm"
            class="sm:ml-auto"
            data-testid="tool-pick-all"
            @click="pickAll"
          >
            {{ $t(`${KEY}.pickAll`, { count: rows.length }) }}
          </AppButton>
        </template>
      </Toolbar>
      <Notice v-if="outcome" :tone="outcome.kind === 'done' ? 'success' : 'danger'" compact>
        {{ outcome.text }}
      </Notice>
      <QueryState :loading="list.isPending.value" :error="list.error.value" @retry="list.refetch()">
        <template #skeleton><SubmissionTableSkeleton has-pick-column /></template>
        <EmptyState v-if="rows.length === 0" compact>
          {{ $t(problem || user ? `${KEY}.emptyFiltered` : `${KEY}.empty`) }}
          <template #action>
            <AppButton size="sm" :to="{ name: 'contest', params: { key: contest.key } }">
              {{ $t('admin.contests.workbench.viewAsStudent') }}
            </AppButton>
          </template>
        </EmptyState>
        <template v-else>
          <BulkBar :count="picked.length" @clear="picked = []">
            <AppButton size="sm" @click="dialogs?.open('rescore')">
              {{ $t('common.rescore') }}
            </AppButton>
            <AppButton size="sm" @click="dialogs?.open('rejudge')">
              <template #icon>
                <component :is="STAFF_ICONS.rejudge" class="size-4" aria-hidden="true" />
              </template>
              {{ $t('common.rejudge') }}
            </AppButton>
          </BulkBar>
          <SubmissionTable
            :submissions="rows"
            :problem-labels="problemLabels"
            :contest-points="contestPoints"
            :picked-ids="canRejudge ? picked : undefined"
            unlimited-picks
            @toggle-pick="togglePick"
          />
        </template>
      </QueryState>
      <BatchActionDialogs
        ref="dialogs"
        :body="body"
        :line="line"
        :rescore-note="$t(`${KEY}.rescoreNote`)"
        @outcome="showOutcome"
      />
    </div>
  </PageSection>
</template>
