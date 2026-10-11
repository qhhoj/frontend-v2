<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useProblemMetaQuery } from '@/features/problems/problems.queries';
import { translate } from '@/i18n';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import BatchActionDialogs from '../rejudge/BatchActionDialogs.vue';
import type { RejudgeOutcome } from '../rejudge/use-bulk-rejudge';
import AdminSubmissionFilterForm from './AdminSubmissionFilterForm.vue';
import AdminSubmissionTable from './AdminSubmissionTable.vue';
import SubmissionBulkBar from './SubmissionBulkBar.vue';
import {
  batchBodyOf,
  filtersFromQuery,
  listQueryOf,
  queryOfFilters,
} from './admin-submission-filters';
import { useAdminSubmissionListQuery } from './admin-submissions.queries';

const route = useRoute();
const router = useRouter();
const applied = computed(() => filtersFromQuery(route.query));
/** The form edits a draft; Apply puts it in the URL, which is what the list reads. */
const draft = ref(filtersFromQuery(route.query));
const { data, isPending, error, refetch } = useAdminSubmissionListQuery(() =>
  listQueryOf(applied.value),
);
const metaQuery = useProblemMetaQuery();
const languages = computed(() => metaQuery.data.value?.languages ?? []);
const items = computed(() => data.value?.items ?? []);
const selected = ref<string[]>([]);
const allMatching = ref(false);
const outcome = ref<RejudgeOutcome | null>(null);
const dialogs = useTemplateRef('dialogs');

/** A new filter or page starts a new selection: ids from another filter must not ride along. */
watch(applied, (filters) => {
  draft.value = { ...filters };
  clearSelection();
});
function clearSelection() {
  selected.value = [];
  allMatching.value = false;
}
/** A refusal keeps the selection, so staff can retry without ticking the rows again. */
function showOutcome(next: RejudgeOutcome) {
  outcome.value = next;
  if (next.kind === 'done') clearSelection();
}
const apply = () => router.push({ query: queryOfFilters({ ...draft.value, page: 1 }) });
const reset = () => router.push({ query: {} });
const body = computed(() =>
  batchBodyOf(applied.value, { ids: selected.value, allMatching: allMatching.value }),
);
const line = computed(() =>
  allMatching.value
    ? translate('admin.submissions.bulk.lineAll')
    : translate('admin.submissions.bulk.lineSelected', { count: selected.value.length }),
);
</script>

<template>
  <div class="flex flex-col gap-5">
    <AdminPageHeader
      :title="$t('admin.shell.screens.submissions')"
      :lead="$t('admin.submissions.lead')"
    >
      <template #actions>
        <RouterLink
          :to="{ name: 'admin-rejudge' }"
          class="text-sm font-semibold text-accent-text underline"
        >
          {{ $t('admin.submissions.toRejudge') }}
        </RouterLink>
      </template>
    </AdminPageHeader>
    <AdminSubmissionFilterForm
      v-model:filters="draft"
      :languages="languages"
      @apply="apply"
      @reset="reset"
    />
    <AdminStatus v-if="outcome" :kind="outcome.kind" :text="outcome.text" />
    <SubmissionBulkBar
      v-model:all-matching="allMatching"
      :selected-count="selected.length"
      :total="data?.meta.total ?? 0"
      :page-count="items.length"
      :can-take-all="applied.statuses.length === 0"
      @clear="clearSelection"
      @rejudge="dialogs?.open('rejudge')"
      @rescore="dialogs?.open('rescore')"
    />
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <SkeletonBlock v-for="index in 8" :key="index" class="h-10 w-full" />
      </template>
      <section class="glass flex flex-col gap-3 rounded-panel p-3 sm:p-4">
        <p class="px-1 text-sm text-muted">
          {{ $t('admin.submissions.total', { count: data?.meta.total ?? 0 }) }}
        </p>
        <p v-if="items.length === 0" class="p-4 text-center text-muted">
          {{ $t('admin.submissions.empty') }}
        </p>
        <AdminSubmissionTable
          v-else
          v-model:selected="selected"
          :items="items"
          :label="$t('admin.shell.screens.submissions')"
          selectable
        />
      </section>
      <NumberedPager v-if="data" :meta="data.meta" :label="$t('admin.submissions.pager')" />
    </QueryState>
    <BatchActionDialogs ref="dialogs" :body="body" :line="line" @outcome="showOutcome" />
  </div>
</template>
