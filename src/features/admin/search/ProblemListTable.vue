<script setup lang="ts">
import { Database } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RouteLocationRaw } from 'vue-router';
import type { NumberedPageMeta } from '@/api/client';
import type { ProblemListItem } from '@/api/types/problems';
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';
import type { DataTableColumn } from '@/components/ui/DataTableColumns';
import RowMenu from '@/components/ui/RowMenu.vue';
import StretchedLink from '@/components/ui/StretchedLink.vue';
import ProblemTable from '@/features/problems/ProblemTable.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import ProblemCloneDialog from '../problems/general/ProblemCloneDialog.vue';
import { standardRowMenu } from '../ui/table/standard-row-menu';
import ProblemSetupMark from './ProblemSetupMark.vue';
import { listStepsOf, nextListStep } from './problem-setup-marks';

/**
 * One page of the problems the account may edit, on the one problem table (`ProblemTable managed`): the name and code
 * open the editor (the whole row does), then the four-segment setup mark, the next step as a link to where it is done,
 * who can see the problem as a tag, and the acceptance rate. "⋯" holds Xem · Nhân bản… · Dữ liệu chấm · Xóa…. On a phone
 * a row is one `--qh-row` line: name over code, the mark, the next step; the other columns are left to the editor.
 */
const props = defineProps<{
  items: ProblemListItem[];
  meta: NumberedPageMeta | undefined;
  selectable: boolean;
  loading: boolean;
  error: unknown;
  filtered: boolean;
  /** The list is the review queue: every private row is a suggestion (the list rows do not say so themselves). */
  isSuggestedQueue: boolean;
}>();
const selected = defineModel<Set<string>>('selected', { required: true });
const emit = defineEmits<{ retry: []; 'clear-filters': []; delete: [code: string] }>();
const locale = useLocaleStore();
const { t } = useI18n();
const { can } = usePermissions();

const columns = computed<DataTableColumn[]>(() => [
  { key: 'setup', label: t('admin.problemList.columns.setup'), cellClass: 'w-28' },
  { key: 'next', label: t('admin.problemList.columns.next'), cellClass: 'whitespace-nowrap' },
  {
    key: 'visibility',
    label: t('admin.problemList.columns.visibility'),
    cellClass: 'whitespace-nowrap',
    hideBelow: 'lg',
  },
  { key: 'acRate', label: t('problem.strip.acRate'), align: 'end', hideBelow: 'lg' },
]);
const editorOf = (code: string): RouteLocationRaw => ({
  name: 'admin-problemGeneral',
  params: { code },
});

/** The row's next step: its words and where it is done; null when the problem is ready or has no readiness. */
function nextOf(problem: ProblemListItem) {
  const step = nextListStep(listStepsOf(problem) ?? []);
  if (!step) return null;
  return {
    label: t(`admin.problemList.next.${step.action}`),
    to: { name: step.routeName, params: { code: problem.code } },
  };
}
type Visibility = 'public' | 'organization' | 'suggested' | 'draft';
function visibilityOf(problem: ProblemListItem): Visibility {
  if (!problem.isPublic) return props.isSuggestedQueue ? 'suggested' : 'draft';
  return problem.isOrganizationPrivate ? 'organization' : 'public';
}
/** No solver and a rate of zero says nothing yet: a dash, not "0 %". */
const acRateText = (problem: ProblemListItem) =>
  problem.acRate === 0 && problem.userCount === 0
    ? '—'
    : `${formatNumber(problem.acRate, locale.locale, 1)}%`;

const cloning = ref('');
const isCloneOpen = ref(false);
function askClone(code: string) {
  cloning.value = code;
  isCloneOpen.value = true;
}
const menuItems = (code: string) =>
  standardRowMenu({
    view: { name: 'problem', params: { code } },
    clone: can('judge.clone_problem') ? () => askClone(code) : undefined,
    extra: [
      {
        label: t('admin.problemList.menu.data'),
        icon: Database,
        to: { name: 'admin-problemData', params: { code } },
      },
    ],
    remove: can('judge.delete_problem') ? { run: () => emit('delete', code) } : undefined,
  });
</script>

<template>
  <ProblemTable
    v-model:selected="selected"
    managed
    :problems="items"
    :extra-columns="columns"
    :row-target="editorOf"
    :selectable="selectable"
    :label="$t('admin.problemList.tableCaption')"
    :meta="meta"
    :loading="loading"
    :error="error"
    :filtered="filtered"
    @retry="emit('retry')"
    @clear-filters="emit('clear-filters')"
  >
    <template #cell-setup="{ row }">
      <ProblemSetupMark v-if="listStepsOf(row)" :steps="listStepsOf(row)!" />
    </template>
    <template #cell-next="{ row }">
      <AppButton v-if="nextOf(row)" tone="link" :to="nextOf(row)!.to">{{
        nextOf(row)!.label
      }}</AppButton>
      <span v-else-if="row.setup" class="text-meta text-muted">{{
        $t('admin.problemList.setup.ready')
      }}</span>
    </template>
    <template #cell-visibility="{ row }">
      <Chip :strong="row.isPublic">{{
        $t(`admin.problemList.visibility.${visibilityOf(row)}`)
      }}</Chip>
    </template>
    <template #cell-acRate="{ row }">{{ acRateText(row) }}</template>
    <template #actions="{ row }">
      <RowMenu
        :label="$t('admin.problemList.menu.label', { code: row.code })"
        :items="menuItems(row.code)"
      />
    </template>
    <template #bulk><slot name="bulk" /></template>
    <template #card="{ row }">
      <li
        class="box-link flex min-h-(--qh-row) items-center gap-3 border-b border-line px-2 py-1"
        :data-code="row.code"
      >
        <span class="flex min-w-0 flex-1 flex-col">
          <StretchedLink
            :to="editorOf(row.code)"
            :title="row.name"
            class="line-clamp-2 text-body font-semibold text-content"
            >{{ row.name }}</StretchedLink
          >
          <span class="truncate font-mono text-small text-muted">{{ row.code }}</span>
        </span>
        <ProblemSetupMark v-if="listStepsOf(row)" :steps="listStepsOf(row)!" class="shrink-0" />
        <!-- A fixed width, so the marks of all rows stand in one column. -->
        <span class="flex w-28 shrink-0 items-center">
          <AppButton v-if="nextOf(row)" tone="link" :to="nextOf(row)!.to" class="min-h-11">{{
            nextOf(row)!.label
          }}</AppButton>
          <span v-else-if="row.setup" class="text-meta text-muted">{{
            $t('admin.problemList.setup.ready')
          }}</span>
        </span>
      </li>
    </template>
  </ProblemTable>
  <ProblemCloneDialog v-model:visible="isCloneOpen" :code="cloning" />
</template>
