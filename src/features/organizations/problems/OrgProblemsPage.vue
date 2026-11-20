<script setup lang="ts">
import { Plus } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import type { OrganizationProblem } from '@/api/types/organization-problems';
import EmptyState from '@/components/EmptyState.vue';
import Card from '@/components/ui/Card.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import AppButton from '@/components/ui/AppButton.vue';
import type { DataTableColumn } from '@/components/ui/DataTableColumns';
import ProblemTable from '@/features/problems/ProblemTable.vue';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import { useFocusFallback } from '@/lib/use-focus-fallback';
import { ORG_BITS } from '../org-bits';
import { useOrganization } from '../use-organization';
import { orgFailureText } from './org-problem-errors';
import { filtersFromQuery, listStateOf, routeQueryOf, withFilter } from './org-problem-filters';
import type { OrgProblemFilters } from './org-problems.queries';
import { useOrgProblemsQuery, useProblemTagsQuery } from './org-problems.queries';
import OrgProblemFiltersBar from './OrgProblemFilters.vue';
import OrgProblemActions from './OrgProblemActions.vue';
import OrgProblemMarks from './OrgProblemMarks.vue';
import OrgProblemTags from './OrgProblemTags.vue';
import OrgProblemTagsDialog from './OrgProblemTagsDialog.vue';
import InlineBit from '@/components/InlineBit.vue';
import OrgBulkResult from './OrgBulkResult.vue';
import OrgBulkTagDialog from './OrgBulkTagDialog.vue';
import OrgTagCatalogue from './OrgTagCatalogue.vue';
import { useOrgProblemActions } from './use-org-problem-actions';
import { useOrgBulk } from './use-org-bulk';
import type { BulkCommand } from './use-org-bulk';

const route = useRoute();
const router = useRouter();
const { slug, query: organizationQuery } = useOrganization();
const organization = computed(() => organizationQuery.data.value);
const canRead = computed(() =>
  Boolean(organization.value?.viewer?.isMember || organization.value?.viewer?.canAdminister),
);
const isAdmin = computed(() => organization.value?.viewer?.canAdminister === true);
/** "Tạo bài tập" for whoever may create problems for the organization, above the list and in its empty state. */
const canCreate = computed(() => organization.value?.viewer?.canCreateProblem === true);
const createTarget = computed(() => ({
  name: 'admin-problemNew',
  query: { organization: slug.value },
}));
const filters = computed(() => filtersFromQuery(route.query));
const problems = useOrgProblemsQuery(slug, filters, canRead);
const tags = useProblemTagsQuery(slug, canRead);
const tagList = computed(() => tags.data.value?.items ?? []);
const listState = computed(() => listStateOf(problems.data.value?.meta.total, filters.value));
const filteredTagName = computed(
  () =>
    tagList.value.find((tag) => tag.slug === filters.value.tag)?.name ?? filters.value.tag ?? '',
);
/** Codes the admin ticked on the current page (Task 8's bulk bar acts on them). */
const selected = ref<string[]>([]);
const actions = useOrgProblemActions(slug);
const bulk = useOrgBulk(slug, selected);
/** The table keeps its ticks as a set of codes. */
const selectedCodes = computed({
  get: () => new Set(selected.value),
  set: (codes: Set<string>) => (selected.value = [...codes]),
});
const { t } = useI18n();
const locale = useLocaleStore();
/** The organization's own columns after the name: its tags and the last edit. An administrator also gets tick boxes and the two row actions. */
const columns = computed<DataTableColumn[]>(() => [
  { key: 'tags', label: t('orgProblems.columns.tags'), cellClass: 'whitespace-nowrap' },
  { key: 'updatedAt', label: t('orgProblems.columns.updated'), align: 'end', hideBelow: 'xl' },
]);
const NO_ROWS: OrganizationProblem[] = [];
/** A selection belongs to the page and organization it was ticked on: neither a pager link nor a move to another organization keeps it. */
watch([slug, filters], () => (selected.value = []));
const listCard = ref<{ $el: HTMLElement } | null>(null);
const listElement = () => listCard.value?.$el;
useFocusFallback(() => selected.value.length, listElement);
useFocusFallback(() => problems.data.value?.items.length, listElement);
const isBulkTagOpen = ref(false);
function runTagBulk(command: BulkCommand) {
  isBulkTagOpen.value = false;
  bulk.run(command);
}
const editing = ref<OrganizationProblem | null>(null);
const isTagsOpen = computed({
  get: () => editing.value !== null,
  set: (isOpen: boolean) => {
    if (!isOpen) editing.value = null;
  },
});
const tagsFailure = computed(() =>
  actions.tagsMutation.error.value ? orgFailureText(actions.tagsMutation.error.value) : '',
);

function applyFilters(change: Partial<Omit<OrgProblemFilters, 'page'>>) {
  void router.replace({ query: routeQueryOf(withFilter(filters.value, change)) });
}
function openTags(row: OrganizationProblem) {
  actions.tagsMutation.reset();
  editing.value = row;
}
function saveTags(tagIds: string[]) {
  if (!editing.value) return;
  actions.tagsMutation.mutate(
    { code: editing.value.code, tagIds },
    { onSuccess: () => void (editing.value = null) },
  );
}
</script>

<template>
  <StatePanel
    v-if="organization && !canRead"
    :kind="ORG_BITS.forbidden"
    :title="$t('orgProblems.forbiddenTitle')"
    :body="$t('orgProblems.forbiddenBody')"
  />
  <section v-else-if="organization" data-testid="org-problems-tab" class="flex flex-col gap-5">
    <SettingsNotice v-if="!isAdmin" tone="info" :bit="ORG_BITS.memberReadOnly">
      <span
        class="mr-2 rounded-pill bg-accent-soft px-2 py-0.5 text-sm font-semibold"
        data-testid="read-only-badge"
        >{{ $t('orgProblems.readOnlyBadge') }}</span
      >
      {{ $t('orgProblems.memberReadOnly') }}
    </SettingsNotice>
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_var(--qh-sidebar-width)] lg:items-start">
      <Card
        ref="listCard"
        as="div"
        tabindex="-1"
        data-testid="org-problem-list"
        class="flex min-w-0 flex-col gap-4 p-5"
      >
        <OrgProblemFiltersBar
          :filters="filters"
          :tags="tagList"
          :total="problems.data.value?.meta.total ?? null"
          :is-loading="problems.isLoading.value"
          @change="applyFilters"
        >
          <template v-if="canCreate && listState !== 'empty'" #actions>
            <AppButton tone="primary" data-testid="org-tab-create-problem" :to="createTarget">
              <template #icon><Plus class="size-4" aria-hidden="true" /></template>
              {{ $t('create.problem') }}
            </AppButton>
          </template>
        </OrgProblemFiltersBar>
        <QueryState
          :loading="problems.isLoading.value"
          :error="problems.error.value"
          @retry="problems.refetch()"
        >
          <template #skeleton>
            <ProblemTable
              managed
              loading
              :problems="NO_ROWS"
              :extra-columns="columns"
              :selectable="isAdmin"
              :label="$t('orgProblems.tableCaption')"
            />
          </template>
          <StatePanel
            v-if="listState === 'empty'"
            :kind="ORG_BITS.listEmpty"
            :title="$t('orgProblems.emptyTitle')"
            :body="$t(canCreate ? 'orgProblems.emptyBodyCreator' : 'orgProblems.emptyBody')"
          >
            <AppButton
              v-if="canCreate"
              tone="primary"
              data-testid="org-tab-create-problem"
              :to="createTarget"
            >
              <template #icon><Plus class="size-4" aria-hidden="true" /></template>
              {{ $t('create.problem') }}
            </AppButton>
            <AppButton
              v-if="filters.archived === 'false'"
              @click="applyFilters({ archived: 'true' })"
            >
              {{ $t('orgProblems.showArchived') }}
            </AppButton>
          </StatePanel>
          <EmptyState
            v-else-if="listState === 'filteredEmpty'"
            compact
            :kind="ORG_BITS.filteredEmpty"
          >
            {{
              filters.tag
                ? $t('orgProblems.filteredEmptyTag', { tag: filteredTagName })
                : $t('orgProblems.filteredEmpty')
            }}
            <button
              v-if="filters.archived === 'false'"
              type="button"
              class="ml-1 inline-flex min-h-11 items-center font-semibold text-accent-text underline"
              @click="applyFilters({ archived: 'true' })"
            >
              {{ $t('orgProblems.showArchived') }}
            </button>
          </EmptyState>
          <template v-else-if="problems.data.value">
            <ProblemTable
              v-model:selected="selectedCodes"
              managed
              :problems="problems.data.value.items"
              :extra-columns="columns"
              :selectable="isAdmin"
              :label="$t('orgProblems.tableCaption')"
            >
              <template #name-end="{ row }"><OrgProblemMarks :row="row" /></template>
              <template #cell-tags="{ row }">
                <span v-if="row.tags.length === 0" class="text-muted">{{
                  $t('orgProblems.noTags')
                }}</span>
                <OrgProblemTags v-else :tags="row.tags" one-line />
              </template>
              <template #cell-updatedAt="{ row }">{{
                formatDate(row.updatedAt, 'date', locale.locale)
              }}</template>
              <template v-if="isAdmin" #actions="{ row }">
                <OrgProblemActions
                  :row="row"
                  :is-busy="actions.busyCode.value === row.code"
                  @edit-tags="openTags(row)"
                  @toggle-archive="actions.toggleArchive(row)"
                />
              </template>
              <template #bulk>
                <AppButton size="sm" :disabled="bulk.isPending.value" @click="isBulkTagOpen = true">
                  {{ $t('orgProblems.bulk.tag') }}
                </AppButton>
                <AppButton
                  size="sm"
                  :disabled="bulk.isPending.value"
                  @click="bulk.run({ action: 'archive' })"
                >
                  {{ $t('orgProblems.bulk.archive') }}
                </AppButton>
                <AppButton
                  size="sm"
                  :disabled="bulk.isPending.value"
                  @click="bulk.run({ action: 'unarchive' })"
                >
                  {{ $t('orgProblems.bulk.unarchive') }}
                </AppButton>
              </template>
            </ProblemTable>
            <NumberedPager :meta="problems.data.value.meta" :label="$t('orgProblems.pager')" />
          </template>
        </QueryState>
        <p v-if="actions.failureText.value" role="alert" class="text-sm text-negative">
          {{ actions.failureText.value }}
        </p>
      </Card>
      <OrgTagCatalogue
        v-if="isAdmin"
        :slug="slug"
        :tags="tagList"
        :is-loading="tags.isLoading.value"
        :error="tags.error.value"
        @retry="tags.refetch()"
      />
    </div>
    <OrgBulkResult
      v-if="bulk.result.value && bulk.action.value"
      :result="bulk.result.value"
      :action="bulk.action.value"
      @dismiss="bulk.dismiss()"
    />
    <p
      v-if="bulk.failureText.value"
      role="alert"
      data-testid="org-bulk-failure"
      class="flex items-center gap-2 text-sm text-negative"
    >
      <InlineBit :kind="ORG_BITS.bulkRefused" />{{ bulk.failureText.value }}
    </p>
    <OrgBulkTagDialog
      v-model:visible="isBulkTagOpen"
      :tags="tagList"
      :busy="bulk.isPending.value"
      :count="selected.length"
      @confirm="runTagBulk"
    />
    <OrgProblemTagsDialog
      v-model:visible="isTagsOpen"
      :problem="editing"
      :tags="tagList"
      :busy="actions.tagsMutation.isPending.value"
      :failure-text="tagsFailure"
      @save="saveTags"
    />
  </section>
</template>
