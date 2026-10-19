<script setup lang="ts">
import { Building2, Database, Globe, Lock } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { NumberedPageMeta } from '@/api/client';
import type { ProblemListItem } from '@/api/types/problems';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import AdminChip from '../ui/AdminChip.vue';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import AdminRowMenu from '../ui/table/AdminRowMenu.vue';
import { standardRowMenu } from '../ui/table/standard-row-menu';
import ProblemCloneDialog from '../problems/general/ProblemCloneDialog.vue';
import type { AdminColumn } from '../ui/table/table-columns';
import HighlightedText from './HighlightedText.vue';

/**
 * One page of the staff problem list (`tr[data-code]`, a card per problem on phones): sortable Bài / Điểm / Ngày đăng
 * headers bound to `?sort=`; the title opens the editor and "⋯" holds Xem · Nhân bản… · Xóa… (the admin row contract).
 * Points read as a plain number; the "từng phần" chip sits with the status chips. `toolbar` and `bulk` pass through.
 */
defineProps<{
  items: ProblemListItem[];
  meta: NumberedPageMeta | undefined;
  search: string;
  selectable: boolean;
  loading: boolean;
  error: unknown;
  filtered: boolean;
}>();
const sort = defineModel<string>('sort', { required: true });
const selected = defineModel<Set<string>>('selected', { required: true });
const emit = defineEmits<{ retry: []; 'clear-filters': []; delete: [code: string] }>();
const locale = useLocaleStore();
const { t } = useI18n();
const { can } = usePermissions();

const columns = computed<AdminColumn[]>(() => [
  {
    key: 'problem',
    label: t('admin.problemList.columns.problem'),
    priority: 'primary',
    sort: { asc: 'name', desc: '-name' },
  },
  {
    key: 'status',
    label: t('admin.problemList.columns.status'),
    priority: 'badge',
    cellClass: 'max-w-80',
  },
  { key: 'group', label: t('admin.problemList.columns.group'), cellClass: 'max-w-48 truncate' },
  { key: 'authors', label: t('admin.problemList.columns.authors') },
  {
    key: 'points',
    label: t('admin.problemList.columns.points'),
    align: 'end',
    sort: { asc: 'points', desc: '-points', first: 'desc' },
  },
  {
    key: 'date',
    label: t('admin.problemList.columns.date'),
    cellClass: 'whitespace-nowrap text-muted',
    sort: { asc: 'date', desc: '-date', first: 'desc' },
  },
]);
const editorOf = (code: string) => ({ name: 'admin-problemGeneral', params: { code } });
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
  <AdminDataTable
    v-model:sort="sort"
    v-model:selected="selected"
    :pager="meta ? { meta, label: $t('admin.search.pager') } : undefined"
    :columns="columns"
    :rows="items"
    :row-key="(problem) => problem.code"
    :row-label="(problem) => problem.code"
    :row-attrs="(problem) => ({ 'data-code': problem.code })"
    :label="$t('admin.problemList.tableCaption')"
    :selectable="selectable"
    :loading="loading"
    :error="error"
    :filtered="filtered"
    :empty-text="$t('admin.search.problems.empty')"
    @retry="emit('retry')"
    @clear-filters="emit('clear-filters')"
  >
    <template #toolbar><slot name="toolbar" /></template>
    <template #bulk><slot name="bulk" /></template>
    <template v-if="$slots.empty" #empty><slot name="empty" /></template>
    <template #cell-problem="{ row }">
      <RouterLink
        :to="editorOf(row.code)"
        class="block min-w-0 font-semibold text-accent-text hover:underline"
      >
        <HighlightedText :text="row.name" :query="search" />
      </RouterLink>
      <span class="block font-mono text-xs text-muted">
        <HighlightedText :text="row.code" :query="search" />
      </span>
    </template>
    <template #cell-status="{ row }">
      <span class="inline-flex gap-1">
        <AdminChip v-if="row.isPublic" tone="positive" :icon="Globe">
          {{ $t('admin.problemList.status.public') }}
        </AdminChip>
        <AdminChip v-else :icon="Lock">{{ $t('admin.problemList.status.private') }}</AdminChip>
        <AdminChip v-if="row.isOrganizationPrivate" tone="info" :icon="Building2">
          {{ $t('admin.problemList.orgPrivate') }}
        </AdminChip>
        <AdminChip v-if="row.partial" :title="$t('admin.problemList.partialHint')">
          {{ $t('admin.problemList.partial') }}
        </AdminChip>
      </span>
    </template>
    <template #cell-group="{ row }">{{ row.group?.fullName ?? '—' }}</template>
    <template #cell-authors="{ row }">
      <span v-if="row.authors.length === 0" class="text-muted">—</span>
      <span v-else class="inline-flex items-center gap-1.5">
        <AdminUserLabel
          :username="row.authors[0]!.username"
          :rating="row.authors[0]!.rating"
          :link="false"
        />
        <span v-if="row.authors.length > 1" class="text-xs text-muted">
          {{ $t('admin.problemList.moreAuthors', { count: row.authors.length - 1 }) }}
        </span>
      </span>
    </template>
    <template #cell-points="{ row }">{{ formatNumber(row.points, locale.locale) }}</template>
    <template #cell-date="{ row }">
      {{ row.date ? formatDate(row.date, 'date', locale.locale) : '—' }}
    </template>
    <template #actions="{ row }">
      <AdminRowMenu
        :label="$t('admin.problemList.menu.label', { code: row.code })"
        :items="menuItems(row.code)"
      />
    </template>
  </AdminDataTable>
  <ProblemCloneDialog v-model:visible="isCloneOpen" :code="cloning" />
</template>
