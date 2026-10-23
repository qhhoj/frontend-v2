<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import type { DeletedProblem } from '@/api/types/problem-lifecycle';
import { useFocusFallback } from '@/lib/use-focus-fallback';
import { actorName } from '@/lib/actor';
import { formatDate } from '@/lib/format-date';
import { pageFromQuery } from '@/lib/paging';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import AdminChip from '../../ui/AdminChip.vue';
import AdminPageHeader from '../../ui/AdminPageHeader.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { buttonClass } from '../../ui/controls';
import AdminDataTable from '../../ui/table/AdminDataTable.vue';
import AdminRowMenu from '../../ui/table/AdminRowMenu.vue';
import type { AdminColumn } from '../../ui/table/table-columns';
import { graceTextOf, graceToneOf } from './days-left';
import { useDeletedProblemsQuery } from './lifecycle.queries';
import ProblemsIndexTabs from './ProblemsIndexTabs.vue';
import TypedCodeDialog from './TypedCodeDialog.vue';
import { useDeletedActions } from './use-deleted-actions';

const route = useRoute();
const locale = useLocaleStore();
const { t } = useI18n();
const page = computed(() => pageFromQuery(route.query.page));
const { data, isPending, error, refetch } = useDeletedProblemsQuery(page);
const rows = computed(() => data.value?.items ?? []);
const { isSuperuser } = usePermissions();
const { restore, purge, refusal, restoreRow, purgeRow, openPurgeFor } = useDeletedActions();

const columns = computed<AdminColumn[]>(() => [
  { key: 'problem', label: t('admin.lifecycle.columns.problem'), priority: 'primary' },
  { key: 'grace', label: t('admin.lifecycle.columns.grace'), priority: 'badge' },
  { key: 'deletedAt', label: t('admin.lifecycle.columns.deletedAt') },
  { key: 'deletedBy', label: t('admin.lifecycle.columns.deletedBy') },
]);
const graceText = (row: DeletedProblem) => {
  const grace = graceTextOf(row);
  return t(grace.key, { count: grace.count }, grace.count);
};

const purging = ref<DeletedProblem | null>(null);
const isPurgeOpen = computed({
  get: () => purging.value !== null,
  set: (isOpen: boolean) => {
    if (!isOpen) purging.value = null;
  },
});
const purgeFailure = computed(() =>
  purge.failure.value ? failureTextOf(purge.failure.value) : '',
);
function openPurge(row: DeletedProblem) {
  openPurgeFor();
  purging.value = row;
}
async function confirmPurge(typed: string) {
  if (!purging.value) return;
  const result = await purgeRow({ code: purging.value.code, confirmCode: typed });
  if (result) purging.value = null;
}
const menuItems = (row: DeletedProblem) => [
  {
    label: t('admin.lifecycle.purgeNow'),
    icon: Trash2,
    danger: true,
    run: () => openPurge(row),
  },
];

const listSection = ref<HTMLElement | null>(null);
/** A restored row leaves the list: focus goes to the list, not to the page top. */
useFocusFallback(
  () => data.value?.items.length,
  () => listSection.value,
);
</script>

<template>
  <div class="flex flex-col gap-4">
    <AdminPageHeader
      :title="$t('admin.shell.screens.problemsDeleted')"
      :lead="$t('admin.lifecycle.deletedLead')"
    />
    <ProblemsIndexTabs />
    <AdminStatus v-if="refusal" kind="refused" :text="refusal" />
    <section
      ref="listSection"
      tabindex="-1"
      data-testid="deleted-problems"
      class="focus-visible:outline-offset-2"
    >
      <AdminDataTable
        :pager="data?.meta ? { meta: data.meta, label: $t('admin.lifecycle.pager') } : undefined"
        :columns="columns"
        :rows="rows"
        :row-key="(row) => row.code"
        :row-label="(row) => row.code"
        :row-attrs="(row) => ({ 'data-code': row.code })"
        :label="$t('admin.lifecycle.tableCaption')"
        :loading="isPending"
        :error="error"
        :skeleton-rows="3"
        :empty-text="$t('admin.lifecycle.empty')"
        @retry="refetch()"
      >
        <template #cell-problem="{ row }">
          <span class="block font-semibold">{{ row.name }}</span>
          <span class="block font-mono text-xs text-muted">{{ row.code }}</span>
        </template>
        <template #cell-grace="{ row }">
          <AdminChip :tone="graceToneOf(row)">{{ graceText(row) }}</AdminChip>
        </template>
        <template #cell-deletedAt="{ row }">
          <span class="whitespace-nowrap">{{
            formatDate(row.deletedAt, 'datetime', locale.locale)
          }}</span>
        </template>
        <template #cell-deletedBy="{ row }">
          <span class="whitespace-nowrap">{{ actorName(row.deletedBy) }}</span>
        </template>
        <template #actions="{ row }">
          <template v-if="!row.isPurged">
            <button
              type="button"
              :class="buttonClass('secondary', 'sm')"
              :aria-label="$t('admin.lifecycle.restoreLabel', { code: row.code })"
              :aria-disabled="restore.isPending.value ? 'true' : undefined"
              @click="restoreRow(row.code)"
            >
              {{ $t('admin.lifecycle.restore') }}
            </button>
            <AdminRowMenu
              v-if="isSuperuser"
              :label="$t('admin.lifecycle.menu', { code: row.code })"
              :items="menuItems(row)"
            />
          </template>
        </template>
      </AdminDataTable>
    </section>
    <TypedCodeDialog
      v-model:visible="isPurgeOpen"
      :code="purging?.code ?? ''"
      :title="$t('admin.lifecycle.purgeTitle', { code: purging?.code ?? '' })"
      :body="$t('admin.lifecycle.purgeBody')"
      :confirm-label="$t('admin.lifecycle.purgeConfirm')"
      :busy="purge.isPending.value"
      :failure-text="purgeFailure"
      @confirm="confirmPurge"
    />
  </div>
</template>
