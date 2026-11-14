<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { Check, ExternalLink, X } from 'lucide-vue-next';
import type { ShareReport, ShareReportOutcome, ShareReportQueue } from '@/api/types/shares';
import UserLink from '@/components/UserLink.vue';
import { useSettleShareReports, useShareReportsQuery } from '@/features/shares/shares.queries';
import { formatDate } from '@/lib/format-date';
import { pageFromQuery } from '@/lib/paging';
import { useLocaleStore } from '@/stores/locale.store';
import AdminBit from '../shell/AdminBit.vue';
import Chip from '@/components/ui/Chip.vue';
import DataTable from '@/components/ui/DataTable.vue';
import type { DataTableColumn } from '@/components/ui/DataTableColumns';
import PageHeader from '@/components/ui/PageHeader.vue';
import RowMenu from '@/components/ui/RowMenu.vue';
import { useToast } from '@/components/ui/use-toast';
import AdminFilterTabs from '../ui/AdminFilterTabs.vue';
import type { AdminFilterTab } from '../ui/AdminFilterTabs.vue';
import { adminRouteName } from '../admin-screens';

/** The queue of reported shares (`judge.manage_share`): open reports newest first; a report is settled as acted on or dismissed. */
const { t } = useI18n();
const route = useRoute();
const locale = useLocaleStore();
const toast = useToast();
const status = computed<ShareReportQueue>(() =>
  route.query.status === 'settled' ? 'settled' : 'open',
);
const page = computed(() => pageFromQuery(route.query.page));
const { data, isPending, error, refetch } = useShareReportsQuery(page, status);
const reports = computed(() => data.value?.items ?? []);
const settle = useSettleShareReports();

const tabs = computed<AdminFilterTab[]>(() => [
  {
    key: 'open',
    label: t('share.reports.tabs.open'),
    to: { name: adminRouteName('shareReports') },
  },
  {
    key: 'settled',
    label: t('share.reports.tabs.settled'),
    to: { name: adminRouteName('shareReports'), query: { status: 'settled' } },
  },
]);
const columns = computed<DataTableColumn[]>(() => [
  { key: 'share', label: t('share.reports.table.share'), priority: 'primary' },
  { key: 'reason', label: t('share.reports.table.reason') },
  { key: 'note', label: t('share.reports.table.note'), cellClass: 'max-w-64 truncate' },
  { key: 'reporter', label: t('share.reports.table.reporter'), priority: 'meta' },
  { key: 'createdAt', label: t('share.reports.table.createdAt'), priority: 'meta' },
]);

async function settleReport(report: ShareReport, outcome: ShareReportOutcome) {
  if (!report.share) return;
  try {
    await settle.mutateAsync({ code: report.share.code, outcome });
    toast.show({ text: t(`share.reports.settled.${outcome}`) });
  } catch {
    toast.show({ text: t('share.reports.settleFailed'), tone: 'danger' });
  }
}
const menuItems = (report: ShareReport) => [
  ...(report.share
    ? [
        {
          label: t('share.reports.open'),
          icon: ExternalLink,
          to: { name: 'share', params: { code: report.share.code } },
        },
      ]
    : []),
  ...(report.status === 'open' && report.share
    ? [
        {
          label: t('share.reports.resolve'),
          icon: Check,
          run: () => void settleReport(report, 'resolved'),
        },
        {
          label: t('share.reports.dismiss'),
          icon: X,
          run: () => void settleReport(report, 'dismissed'),
        },
      ]
    : []),
];
const codeOf = (report: ShareReport) => report.share?.code ?? '';
</script>

<template>
  <div class="flex flex-col gap-5">
    <PageHeader :title="$t('admin.shell.screens.shareReports')" :lead="$t('share.reports.lead')" />
    <AdminFilterTabs :tabs="tabs" :current="status" :label="$t('share.reports.tabs.label')" />
    <DataTable
      data-testid="share-reports-table"
      :pager="data ? { meta: data.meta, label: $t('share.reports.table.pager') } : undefined"
      :columns="columns"
      :rows="reports"
      :row-key="(report) => report.id"
      :row-label="(report) => codeOf(report) || report.id"
      :label="$t('share.reports.table.caption')"
      :loading="isPending"
      :error="error"
      :skeleton-rows="6"
      @retry="refetch()"
    >
      <template #cell-share="{ row }">
        <RouterLink
          v-if="row.share"
          :to="{ name: 'share', params: { code: row.share.code } }"
          class="font-mono font-semibold text-accent-text hover:underline"
          >/c/{{ row.share.code }}</RouterLink
        >
        <span v-else class="text-muted">{{ $t('share.reports.gone') }}</span>
      </template>
      <template #cell-reason="{ row }">
        <Chip :tone="row.reason === 'contest' ? 'danger' : 'neutral'">
          {{ $t(`share.report.reason.${row.reason}`) }}
        </Chip>
      </template>
      <template #cell-note="{ row }">{{ row.note || '—' }}</template>
      <template #cell-reporter="{ row }">
        <UserLink
          v-if="row.reporter"
          :username="row.reporter.username"
          :rating="row.reporter.rating"
        />
        <span v-else class="text-muted">—</span>
      </template>
      <template #cell-createdAt="{ row }">
        <span class="whitespace-nowrap text-muted">{{
          formatDate(row.createdAt, 'datetime', locale.locale)
        }}</span>
      </template>
      <template #actions="{ row }">
        <RowMenu
          :label="$t('common.table.rowMenu', { name: codeOf(row) || row.id })"
          :items="menuItems(row)"
        />
      </template>
      <template #empty>
        <div class="flex flex-col items-center gap-3 p-6 text-center">
          <AdminBit placement="empty" />
          <p>{{ $t('share.reports.empty') }}</p>
        </div>
      </template>
    </DataTable>
  </div>
</template>
