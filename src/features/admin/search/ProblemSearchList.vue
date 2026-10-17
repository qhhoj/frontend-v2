<script setup lang="ts">
import { Globe, Lock } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import type { BulkVisibilityResult } from '@/api/types/problems';
import EmptyState from '@/components/EmptyState.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import DeleteProblemDialog from '../problems/lifecycle/DeleteProblemDialog.vue';
import { PROBLEM_CODE_PATTERN } from '../problems/problem-code';
import { useProblemEditingMetaQuery } from '../problems/problem-editing.queries';
import { isNotFound } from '../ui/admin-errors';
import { buttonClass } from '../ui/controls';
import { useAdminToast } from '../ui/feedback/use-admin-toast';
import ProblemBulkResult from './ProblemBulkResult.vue';
import ProblemBulkVisibilityDialog from './ProblemBulkVisibilityDialog.vue';
import ProblemListFilters from './ProblemListFilters.vue';
import ProblemListTable from './ProblemListTable.vue';
import {
  useAdminProblemSearchQuery,
  useAuthorIdQuery,
  useExactProblemQuery,
} from './index-search.queries';
import { filterQueryOf, filtersFromQuery, listQueryOf } from './problem-list-filters';
import type { FilterPatch } from './problem-list-filters';

const route = useRoute();
const router = useRouter();
const locale = useLocaleStore();
const { t } = useI18n();
const { can } = usePermissions();
const toast = useAdminToast();
const filters = computed(() => filtersFromQuery(route.query));
const author = computed(() => filters.value.author);
const { data: meta } = useProblemEditingMetaQuery();
const authorLookup = useAuthorIdQuery(author);
const isAuthorUnknown = computed(() => author.value !== '' && isNotFound(authorLookup.error.value));
/** A lookup that failed for another reason (network, 5xx) shows as the list's error, with a retry. */
const lookupError = computed(() => (isAuthorUnknown.value ? null : authorLookup.error.value));
const listQuery = computed(() => listQueryOf(filters.value, authorLookup.data.value));
const isReady = computed(() => author.value === '' || authorLookup.isSuccess.value);
const { data, isPending, error, refetch } = useAdminProblemSearchQuery(listQuery, isReady);
const retry = () => void (lookupError.value ? authorLookup.refetch() : refetch());
const change = (patch: FilterPatch) =>
  void router.replace({ query: filterQueryOf(route.query, patch) });
const sort = computed({
  get: () => filters.value.sort,
  set: (value: string) => change({ sort: value as typeof filters.value.sort }),
});
const isFiltered = computed(() => {
  const { q, status, groupId, typeId, author: name } = filters.value;
  return Boolean(q || groupId || typeId || name) || status !== 'all';
});
const clearFilters = () => change({ q: '', status: 'all', groupId: '', typeId: '', author: '' });

/**
 * "Mở hcmus41c ↵" when the search text is a problem code: at once when a listed row has it, otherwise after asking the
 * editor's endpoint (the code may sit on a later page).
 */
const typedCode = computed(() => filters.value.q.toLowerCase());
const isListedCode = computed(
  () => data.value?.items.some((item) => item.code === typedCode.value) ?? false,
);
const lookupCode = computed(() =>
  data.value && !isListedCode.value && PROBLEM_CODE_PATTERN.test(typedCode.value)
    ? typedCode.value
    : '',
);
const exactLookup = useExactProblemQuery(lookupCode);
const exact = computed(() => {
  const isFound = isListedCode.value || (lookupCode.value !== '' && exactLookup.isSuccess.value);
  if (!isFound) return null;
  const code = typedCode.value;
  return {
    label: t('admin.table.openExact', { code }),
    to: { name: 'admin-problemGeneral', params: { code } },
  };
});

const canBulk = computed(() => can('judge.change_public_visibility'));
const selected = ref(new Set<string>());
const lastResult = ref<BulkVisibilityResult | null>(null);
watch(
  listQuery,
  () => {
    selected.value = new Set();
    lastResult.value = null;
  },
  { deep: true },
);
const isBulkOpen = ref(false);
/** Kept after the dialog closes, so its wording does not flip while it fades out. */
const isBulkPublic = ref(true);
function openBulk(isPublic: boolean) {
  isBulkPublic.value = isPublic;
  isBulkOpen.value = true;
}
/** A clean run is a toast; refusals stay on the page with each code's reason. */
function onBulkDone(result: BulkVisibilityResult) {
  selected.value = new Set();
  const unchanged = result.results.filter((item) => item.outcome === 'unchanged').length;
  if (result.failed > 0) lastResult.value = result;
  else
    toast.show({
      text: t('admin.problemList.bulk.summary', { done: result.done, unchanged, failed: 0 }),
    });
}

const deleting = ref('');
const isDeleteOpen = ref(false);
function askDelete(code: string) {
  deleting.value = code;
  isDeleteOpen.value = true;
}

/** The index lists only the problems the account may edit: an author without edit_all_problem is told so. */
const countKey = computed(() =>
  can('judge.edit_all_problem') ? 'admin.problemList.count' : 'admin.problemList.countOwn',
);
const resultText = computed(() =>
  data.value
    ? t(countKey.value, { total: formatNumber(data.value.meta.total, locale.locale) })
    : undefined,
);
</script>

<template>
  <section class="flex min-w-0 flex-col gap-3" :aria-label="$t('admin.problemList.tableCaption')">
    <ProblemBulkResult v-if="lastResult" :result="lastResult" />
    <ProblemListTable
      v-model:sort="sort"
      v-model:selected="selected"
      :items="isAuthorUnknown ? [] : (data?.items ?? [])"
      :meta="isAuthorUnknown ? undefined : data?.meta"
      :search="filters.q"
      :selectable="canBulk"
      :loading="!isAuthorUnknown && isPending && !lookupError"
      :error="isAuthorUnknown ? null : (error ?? lookupError)"
      :filtered="isFiltered"
      @retry="retry"
      @clear-filters="clearFilters"
      @delete="askDelete"
    >
      <template #toolbar>
        <ProblemListFilters
          :filters="filters"
          :meta="meta"
          :author-error="isAuthorUnknown ? $t('admin.ui.noSuchUser', { name: author }) : ''"
          :result-text="resultText"
          :exact="exact"
          @change="change"
        />
      </template>
      <template #bulk>
        <button type="button" :class="buttonClass('secondary', 'sm')" @click="openBulk(true)">
          <Globe aria-hidden="true" class="size-4" :stroke-width="1.75" />
          {{ $t('admin.problemList.bulk.publish') }}
        </button>
        <button type="button" :class="buttonClass('secondary', 'sm')" @click="openBulk(false)">
          <Lock aria-hidden="true" class="size-4" :stroke-width="1.75" />
          {{ $t('admin.problemList.bulk.unpublish') }}
        </button>
      </template>
      <template v-if="isAuthorUnknown" #empty>
        <EmptyState compact>
          <strong>{{ $t('admin.ui.noSuchUser', { name: author }) }}</strong>
        </EmptyState>
      </template>
    </ProblemListTable>
    <ProblemBulkVisibilityDialog
      v-model:visible="isBulkOpen"
      :codes="[...selected]"
      :is-public="isBulkPublic"
      @done="onBulkDone"
    />
    <DeleteProblemDialog v-model:visible="isDeleteOpen" :code="deleting" />
  </section>
</template>
