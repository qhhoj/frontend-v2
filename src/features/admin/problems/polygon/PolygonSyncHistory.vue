<script setup lang="ts">
import { CircleCheck, CircleX } from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import type { PolygonSyncRun } from '@/api/types/polygon';
import NumberedPager from '@/components/NumberedPager.vue';
import { formatDate } from '@/lib/format-date';
import { pageFromQuery } from '@/lib/paging';
import { useLocaleStore } from '@/stores/locale.store';
import AdminChip from '../../ui/AdminChip.vue';
import AdminUserLabel from '../../ui/AdminUserLabel.vue';
import AdminDataTable from '../../ui/table/AdminDataTable.vue';
import type { AdminColumn } from '../../ui/table/table-columns';
import { importErrorOf } from '../import/import-errors';
import { usePolygonSyncsQuery } from './polygon.queries';

/**
 * The finished imports and syncs, newest first: one problem's (`code`), or every problem's (`code` null, with a Bài column).
 * Rows carry `data-run-result`; a failed run says where it stopped and why. The page lives in `?syncPage=`.
 */
const props = defineProps<{ code: string | null }>();
const PAGE_KEY = 'syncPage';
const route = useRoute();
const locale = useLocaleStore();
const { t } = useI18n();
const page = computed(() => pageFromQuery(route.query[PAGE_KEY]));
const runs = usePolygonSyncsQuery(() => props.code, page);
const items = computed(() => runs.data.value?.items ?? []);

const columns = computed<AdminColumn[]>(() => [
  { key: 'finishedAt', label: t('admin.polygonLink.history.columns.when'), priority: 'primary' },
  { key: 'result', label: t('admin.polygonLink.history.columns.result'), priority: 'badge' },
  ...(props.code === null
    ? [{ key: 'code', label: t('admin.polygonLink.history.columns.problem') }]
    : []),
  { key: 'package', label: t('admin.polygonLink.history.columns.package') },
  { key: 'how', label: t('admin.polygonLink.history.columns.how') },
  { key: 'by', label: t('admin.polygonLink.history.columns.by'), priority: 'meta' },
]);
const dateText = (date: string) => formatDate(date, 'datetime', locale.locale);
/** A run with a code says why in the reader's language; an older one has only the server's English. */
const reasonOf = (row: PolygonSyncRun) =>
  row.errorCode ? importErrorOf(row.errorCode, row.errorParams).title : row.error;
const isFailed = (run: PolygonSyncRun) => run.result === 'failed';
</script>

<template>
  <AdminDataTable
    data-testid="polygon-sync-history"
    :columns="columns"
    :rows="items"
    :row-key="(run) => run.id"
    :row-label="(run) => dateText(run.finishedAt)"
    :row-attrs="(run) => ({ 'data-run-result': run.result })"
    :label="$t('admin.polygonLink.history.title')"
    :loading="runs.isPending.value"
    :error="runs.error.value"
    :skeleton-rows="3"
    :empty-text="$t('admin.polygonLink.history.empty')"
    @retry="runs.refetch()"
  >
    <template #cell-finishedAt="{ row }">
      <time :datetime="row.finishedAt" class="font-semibold whitespace-nowrap">{{
        dateText(row.finishedAt)
      }}</time>
      <span v-if="isFailed(row)" class="block max-w-96 text-sm text-negative">
        <template v-if="row.failedStep">
          {{
            $t('admin.polygon.progress.stoppedAt', {
              step: $t(`admin.polygon.progress.failedSteps.${row.failedStep}`),
            })
          }}
        </template>
        {{ reasonOf(row) }}
      </span>
    </template>
    <template #cell-result="{ row }">
      <AdminChip
        :tone="isFailed(row) ? 'negative' : 'positive'"
        :icon="isFailed(row) ? CircleX : CircleCheck"
        >{{ $t(`admin.polygonLink.history.results.${row.result}`) }}</AdminChip
      >
    </template>
    <template #cell-code="{ row }">
      <RouterLink
        :to="{ name: 'admin-problemGeneral', params: { code: row.code } }"
        class="font-mono font-semibold text-accent-text hover:underline"
        >{{ row.code }}</RouterLink
      >
    </template>
    <template #cell-package="{ row }">
      <span class="font-mono whitespace-nowrap">{{
        $t('admin.polygonLink.source.packageValue', { revision: row.revision, id: row.packageId })
      }}</span>
      <span class="text-muted">
        · {{ $t(`admin.polygonLink.packageType.short.${row.packageType}`) }}</span
      >
      <span v-if="row.packageCreatedAt" class="block text-caption leading-4 text-muted">
        {{ $t('admin.polygonLink.history.builtAt', { date: dateText(row.packageCreatedAt) }) }}
      </span>
    </template>
    <template #cell-how="{ row }">
      <span class="whitespace-nowrap">
        {{ $t(`admin.polygonLink.history.purposes.${row.purpose}`) }} ·
        {{ $t(`admin.polygonLink.history.triggers.${row.trigger}`) }}
      </span>
    </template>
    <template #cell-by="{ row }">
      <AdminUserLabel
        v-if="row.requestedBy"
        :username="row.requestedBy.username"
        :rating="row.requestedBy.rating"
        :link="false"
      />
      <span v-else class="text-muted">—</span>
    </template>
    <template v-if="runs.data.value" #footer>
      <span>{{
        $t('admin.polygonLink.history.total', { total: runs.data.value.meta.total })
      }}</span>
      <NumberedPager
        class="ml-auto"
        compact
        :meta="runs.data.value.meta"
        :query-key="PAGE_KEY"
        :label="$t('admin.polygonLink.history.title')"
      />
    </template>
  </AdminDataTable>
</template>
