<script setup lang="ts">
import { Globe, Lock } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import type { BulkVisibilityResult } from '@/api/types/problems';
import EmptyState from '@/components/EmptyState.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import DeleteProblemDialog from '../problems/lifecycle/DeleteProblemDialog.vue';
import { PROBLEM_CODE_PATTERN } from '../problems/problem-code';
import { useProblemEditingMetaQuery } from '../problems/problem-editing.queries';
import { isNotFound } from '../ui/admin-errors';
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

/** `canCreate`: the empty list offers "Tạo bài tập" (the page owns the form, so the click is passed up). */
defineProps<{ canCreate: boolean }>();
const emit = defineEmits<{ create: [] }>();
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
/** Nothing to edit yet and nothing narrows the list: the page says so and offers the first step. */
const isBare = computed(
  () => !isFiltered.value && !isAuthorUnknown.value && data.value?.meta.total === 0,
);
const resultText = computed(() =>
  data.value
    ? t(countKey.value, { total: formatNumber(data.value.meta.total, locale.locale) })
    : undefined,
);
</script>

<template>
  <section class="flex min-w-0 flex-col gap-3" :aria-label="$t('admin.problemList.tableCaption')">
    <ProblemListFilters
      :filters="filters"
      :meta="meta"
      :author-error="isAuthorUnknown ? $t('admin.ui.noSuchUser', { name: author }) : ''"
      :result-text="resultText"
      :exact="exact"
      @change="change"
    />
    <ProblemBulkResult v-if="lastResult" :result="lastResult" />
    <EmptyState v-if="isBare">
      {{ $t('admin.problemList.emptyOwn') }}
      <template v-if="canCreate" #action>
        <AppButton tone="primary" @click="emit('create')">{{ $t('create.problem') }}</AppButton>
      </template>
    </EmptyState>
    <ProblemListTable
      v-else
      v-model:selected="selected"
      :items="isAuthorUnknown ? [] : (data?.items ?? [])"
      :meta="isAuthorUnknown ? undefined : data?.meta"
      :selectable="canBulk"
      :loading="!isAuthorUnknown && isPending && !lookupError"
      :error="isAuthorUnknown ? null : (error ?? lookupError)"
      :filtered="isFiltered"
      :is-suggested-queue="filters.status === 'suggested'"
      @retry="retry"
      @clear-filters="clearFilters"
      @delete="askDelete"
    >
      <template #bulk>
        <AppButton size="sm" @click="openBulk(true)">
          <template #icon><Globe aria-hidden="true" /></template>
          {{ $t('admin.problemList.bulk.publish') }}
        </AppButton>
        <AppButton size="sm" @click="openBulk(false)">
          <template #icon><Lock aria-hidden="true" /></template>
          {{ $t('admin.problemList.bulk.unpublish') }}
        </AppButton>
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
