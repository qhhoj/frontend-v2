<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import type { UsageOverviewRow, UsageSort } from '@/api/types/organization-usage';
import { formatNumber } from '@/lib/format';
import { pageFromQuery } from '@/lib/paging';
import { formatMebibytes } from '@/lib/quota';
import { useLocaleStore } from '@/stores/locale.store';
import AdminFilterTabs from '../../ui/AdminFilterTabs.vue';
import type { AdminFilterTab } from '../../ui/AdminFilterTabs.vue';
import AdminPageHeader from '../../ui/AdminPageHeader.vue';
import AdminTabs from '../../ui/AdminTabs.vue';
import { buttonClass } from '../../ui/controls';
import AdminDataTable from '../../ui/table/AdminDataTable.vue';
import type { AdminColumn } from '../../ui/table/table-columns';
import { useOrganizationViewTabs } from '../use-organization-view-tabs';
import QuotaEditDialog from './QuotaEditDialog.vue';
import QuotaMeter from './QuotaMeter.vue';
import { useUsageOverviewQuery } from './quota-overview.queries';

/** Rows the skeleton draws. */
const SKELETON_ROWS = 3;
const SORTS: UsageSort[] = ['name', 'credits'];
const route = useRoute();
const router = useRouter();
const locale = useLocaleStore();
const { t } = useI18n();
const sort = computed<UsageSort>(() => (route.query.sort === 'credits' ? 'credits' : 'name'));
const page = computed(() => pageFromQuery(route.query.page));
const { data, isPending, error, refetch } = useUsageOverviewQuery(sort, page);
const rows = computed(() => data.value?.items ?? []);
const editing = ref<UsageOverviewRow | null>(null);
const isEditOpen = computed({
  get: () => editing.value !== null,
  set: (isOpen: boolean) => {
    if (!isOpen) editing.value = null;
  },
});
const sortTabs = computed<AdminFilterTab[]>(() =>
  SORTS.map((key) => ({ key, label: t(`admin.quota.sort.${key}`) })),
);
const chooseSort = (key: string) =>
  void router.replace({ query: key === 'name' ? {} : { sort: key } });
const columns = computed<AdminColumn[]>(() => [
  { key: 'organization', label: t('admin.quota.columns.organization'), priority: 'primary' },
  { key: 'credits', label: t('admin.quota.columns.credits'), cellClass: 'w-1/4' },
  { key: 'storage', label: t('admin.quota.columns.storage'), cellClass: 'w-1/4' },
]);
const credits = (value: number) => formatNumber(value, locale.locale);
const mib = (bytes: number) => formatMebibytes(bytes, locale.locale);
const { tabs: viewTabs } = useOrganizationViewTabs();
</script>

<template>
  <div class="flex flex-col gap-5">
    <AdminPageHeader
      :title="$t('admin.shell.screens.organizationQuotas')"
      :lead="$t('admin.quota.lead')"
    />
    <AdminTabs :tabs="viewTabs" current="quotas" :label="$t('admin.organizations.views.label')" />
    <AdminDataTable
      :pager="data?.meta ? { meta: data.meta, label: $t('admin.quota.pager') } : undefined"
      data-testid="quota-overview"
      :columns="columns"
      :rows="rows"
      :row-key="(row: UsageOverviewRow) => row.slug"
      :row-label="(row: UsageOverviewRow) => row.name"
      :label="$t('admin.quota.tableCaption')"
      :loading="isPending"
      :error="error"
      :skeleton-rows="SKELETON_ROWS"
      :empty-text="$t('admin.quota.empty')"
      @retry="refetch()"
    >
      <template #toolbar>
        <AdminFilterTabs
          :tabs="sortTabs"
          :current="sort"
          :label="$t('admin.quota.sortLabel')"
          @update:current="chooseSort"
        />
      </template>
      <template #cell-organization="{ row }">
        <RouterLink
          data-testid="quota-org-link"
          :to="{ name: 'admin-organizations', query: { org: row.slug } }"
          class="font-semibold text-accent-text hover:underline"
          >{{ row.name }}</RouterLink
        >
        <span class="block font-mono text-xs text-muted">{{ row.slug }}</span>
      </template>
      <template #cell-credits="{ row }">
        <QuotaMeter
          :used="row.creditsUsed"
          :limit="row.creditsLimit"
          :unlimited="row.unlimited"
          :format="credits"
          :label="
            $t('admin.quota.meterLabel', {
              meter: $t('admin.quota.columns.credits'),
              name: row.name,
            })
          "
        />
      </template>
      <template #cell-storage="{ row }">
        <QuotaMeter
          :used="row.storageUsed"
          :limit="row.storageLimit"
          :unlimited="row.unlimited"
          :format="mib"
          :label="
            $t('admin.quota.meterLabel', {
              meter: $t('admin.quota.columns.storage'),
              name: row.name,
            })
          "
        />
      </template>
      <template #actions="{ row }">
        <button
          type="button"
          :class="buttonClass('secondary', 'sm')"
          :aria-label="$t('admin.quota.editLabel', { name: row.name })"
          @click="editing = row"
        >
          {{ $t('admin.quota.edit') }}
        </button>
      </template>
    </AdminDataTable>
    <QuotaEditDialog
      v-model:visible="isEditOpen"
      :slug="editing?.slug ?? null"
      :name="editing?.name ?? ''"
    />
  </div>
</template>
