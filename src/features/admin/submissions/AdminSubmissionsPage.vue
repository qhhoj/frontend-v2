<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useProblemMetaQuery } from '@/features/problems/problems.queries';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { buttonClass } from '../ui/controls';
import BatchActionDialogs from '../rejudge/BatchActionDialogs.vue';
import type { RejudgeOutcome } from '../rejudge/use-bulk-rejudge';
import AdminSubmissionFilterBar from './AdminSubmissionFilterBar.vue';
import AdminSubmissionTable from './AdminSubmissionTable.vue';
import {
  batchBodyOf,
  filtersFromQuery,
  listQueryOf,
  queryOfFilters,
} from './admin-submission-filters';
import type { AdminSubmissionFilters } from './admin-submission-filters';
import { useAdminSubmissionListQuery } from './admin-submissions.queries';

const route = useRoute();
const router = useRouter();
const locale = useLocaleStore();
/** The filter lives in the URL: every change in the filter bar is written there, and the list reads it back. */
const applied = computed(() => filtersFromQuery(route.query));
const { data, isPending, error, refetch } = useAdminSubmissionListQuery(() =>
  listQueryOf(applied.value),
);
const metaQuery = useProblemMetaQuery();
const languages = computed(() => metaQuery.data.value?.languages ?? []);
const items = computed(() => data.value?.items ?? []);
const total = computed(() => data.value?.meta.total ?? 0);
const selected = ref(new Set<string>());
const allMatching = ref(false);
const outcome = ref<RejudgeOutcome | null>(null);
const dialogs = useTemplateRef('dialogs');

/** A new filter or page starts a new selection: ids from another filter must not ride along. */
watch(applied, () => clearSelection());
watch(selected, (ids) => {
  if (ids.size === 0) allMatching.value = false;
});
function clearSelection() {
  selected.value = new Set();
  allMatching.value = false;
}
/** A refusal keeps the selection, so staff can retry without ticking the rows again. */
function showOutcome(next: RejudgeOutcome) {
  outcome.value = next;
  if (next.kind === 'done') clearSelection();
}
const applyFilters = (next: AdminSubmissionFilters) => router.push({ query: queryOfFilters(next) });

/**
 * "Every match" is offered once the whole page is ticked and more rows match than it shows. It is off while the list filters on
 * the judging state, which a batch cannot, so "every match" would reach more rows than the list shows.
 */
const canSelectAll = computed(
  () =>
    applied.value.statuses.length === 0 &&
    !allMatching.value &&
    selected.value.size >= items.value.length &&
    total.value > items.value.length,
);
const body = computed(() =>
  batchBodyOf(applied.value, { ids: [...selected.value], allMatching: allMatching.value }),
);
const line = computed(() =>
  allMatching.value
    ? translate('admin.submissions.bulk.lineAll')
    : translate('admin.submissions.bulk.lineSelected', { count: selected.value.size }),
);
const resultText = computed(() =>
  data.value
    ? translate('admin.submissions.total', { count: formatNumber(total.value, locale.locale) })
    : undefined,
);
</script>

<template>
  <div class="flex flex-col gap-5">
    <AdminPageHeader
      :title="$t('admin.shell.screens.submissions')"
      :lead="$t('admin.submissions.lead')"
    >
      <template #actions>
        <RouterLink :to="{ name: 'admin-rejudge' }" :class="buttonClass('secondary')">
          {{ $t('admin.submissions.toRejudge') }}
        </RouterLink>
      </template>
    </AdminPageHeader>
    <AdminSubmissionFilterBar
      :filters="applied"
      :languages="languages"
      :result-text="resultText"
      @change="applyFilters"
    />
    <AdminStatus v-if="outcome" :kind="outcome.kind" :text="outcome.text" />
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <SkeletonBlock class="h-96 w-full" />
      </template>
      <AdminSubmissionTable
        v-model:selected="selected"
        :items="items"
        :label="$t('admin.shell.screens.submissions')"
        selectable
        :pager="data ? { meta: data.meta, label: $t('admin.submissions.pager') } : undefined"
      >
        <template #bulk>
          <span v-if="allMatching" class="text-sm font-semibold" role="status">
            {{
              $t('admin.submissions.bulk.allSelected', {
                count: formatNumber(total, locale.locale),
              })
            }}
          </span>
          <button
            v-else-if="canSelectAll"
            type="button"
            :class="buttonClass('ghost', 'sm')"
            @click="allMatching = true"
          >
            {{
              $t('admin.submissions.bulk.selectAll', { total: formatNumber(total, locale.locale) })
            }}
          </button>
          <button
            type="button"
            :class="buttonClass('secondary', 'sm')"
            @click="dialogs?.open('rescore')"
          >
            {{ $t('admin.rejudge.filter.rescore') }}
          </button>
          <button
            type="button"
            :class="buttonClass('secondary', 'sm')"
            @click="dialogs?.open('rejudge')"
          >
            {{ $t('admin.submissions.bulk.rejudge') }}
          </button>
        </template>
        <template #empty>
          <p class="px-4 py-8 text-center text-muted">{{ $t('admin.submissions.empty') }}</p>
        </template>
      </AdminSubmissionTable>
    </QueryState>
    <BatchActionDialogs ref="dialogs" :body="body" :line="line" @outcome="showOutcome" />
  </div>
</template>
