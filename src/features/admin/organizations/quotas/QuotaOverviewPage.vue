<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { UsageOverviewRow, UsageSort } from '@/api/types/organization-usage';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { pageFromQuery } from '@/lib/paging';
import { formatMebibytes, meterPercent } from '@/lib/quota';
import { useLocaleStore } from '@/stores/locale.store';
import AdminBit from '../../shell/AdminBit.vue';
import AdminPageHeader from '../../ui/AdminPageHeader.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { ADMIN_BUTTON_CLASS } from '../../ui/classes';
import QuotaEditDialog from './QuotaEditDialog.vue';
import { useUsageOverviewQuery } from './quota-overview.queries';

/** Rows the skeleton draws (the e2e shift case answers three organizations). */
const SKELETON_ROWS = 3;
const SORTS: { id: UsageSort; labelKey: string }[] = [
  { id: 'name', labelKey: 'admin.quota.sortName' },
  { id: 'credits', labelKey: 'admin.quota.sortCredits' },
];
const route = useRoute();
const router = useRouter();
const locale = useLocaleStore();
const sort = computed<UsageSort>(() => (route.query.sort === 'credits' ? 'credits' : 'name'));
const page = computed(() => pageFromQuery(route.query.page));
const { data, isPending, error, refetch } = useUsageOverviewQuery(sort, page);
const editing = ref<UsageOverviewRow | null>(null);
const isEditOpen = computed({
  get: () => editing.value !== null,
  set: (isOpen: boolean) => {
    if (!isOpen) editing.value = null;
  },
});
const savedText = ref('');
const chooseSort = (id: UsageSort) =>
  void router.replace({ query: id === 'name' ? {} : { sort: id } });
const mib = (bytes: number) => formatMebibytes(bytes, locale.locale);
const percentOf = (used: number, limit: number) => meterPercent({ used, limit }).percent;
function openEdit(row: UsageOverviewRow) {
  savedText.value = '';
  editing.value = row;
}
const onSaved = (name: string) => void (savedText.value = translate('admin.quota.saved', { name }));
const CELL = 'py-2 pr-3 align-middle';
</script>

<template>
  <div class="flex flex-col gap-5">
    <AdminPageHeader
      :crumbs="[
        { label: $t('admin.shell.groups.users') },
        { label: $t('admin.shell.screens.organizations'), to: { name: 'admin-organizations' } },
      ]"
      :title="$t('admin.shell.screens.organizationQuotas')"
      :lead="$t('admin.quota.lead')"
    />
    <AdminStatus v-if="savedText" kind="done" :text="savedText" />
    <section data-testid="quota-overview" class="glass flex flex-col gap-4 rounded-panel p-5">
      <div
        class="flex flex-wrap items-center gap-2"
        role="group"
        :aria-label="$t('admin.quota.sortLabel')"
      >
        <AdminBit placement="people" />
        <button
          v-for="option in SORTS"
          :key="option.id"
          type="button"
          :class="ADMIN_BUTTON_CLASS"
          :aria-pressed="sort === option.id"
          @click="chooseSort(option.id)"
        >
          {{ $t(option.labelKey) }}
        </button>
      </div>
      <QueryState :loading="isPending" :error="error" @retry="refetch()">
        <template #skeleton>
          <table data-skeleton-region="quota-table" class="w-full text-left text-sm">
            <thead class="text-muted">
              <tr class="h-14 md:h-auto">
                <th v-for="index in 3" :key="index" :class="CELL">
                  <SkeletonBlock text class="w-16" />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="index in SKELETON_ROWS"
                :key="index"
                class="border-t border-line max-md:first:h-[73px]"
              >
                <td :class="CELL"><SkeletonBlock text class="w-32" /></td>
                <td :class="CELL"><SkeletonBlock text class="w-24" /></td>
                <td class="py-2"><SkeletonBlock pill class="ml-auto h-11 w-16" /></td>
              </tr>
            </tbody>
          </table>
        </template>
        <p v-if="data && data.items.length === 0" class="flex items-center gap-3 text-muted">
          <AdminBit placement="empty" />{{ $t('admin.quota.empty') }}
        </p>
        <div v-else-if="data" class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <caption class="sr-only">
              {{
                $t('admin.quota.tableCaption')
              }}
            </caption>
            <thead class="text-muted">
              <tr>
                <th scope="col" :class="CELL">{{ $t('admin.quota.columns.organization') }}</th>
                <th scope="col" :class="CELL">{{ $t('admin.quota.columns.credits') }}</th>
                <th scope="col" class="hidden md:table-cell" :class="CELL">
                  {{ $t('admin.quota.columns.storage') }}
                </th>
                <th scope="col" class="py-2">
                  <span class="sr-only">{{ $t('admin.quota.edit') }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in data.items" :key="row.slug" class="border-t border-line">
                <td :class="CELL">
                  <span class="font-semibold">{{ row.name }}</span>
                  <span class="block font-mono text-xs text-muted">{{ row.slug }}</span>
                </td>
                <td :class="CELL" class="tabular-nums">
                  {{ formatNumber(row.creditsUsed, locale.locale) }} /
                  {{ formatNumber(row.creditsLimit, locale.locale) }}
                  <span class="text-muted"
                    >·
                    {{
                      $t('admin.quota.percent', {
                        percent: percentOf(row.creditsUsed, row.creditsLimit),
                      })
                    }}</span
                  >
                </td>
                <td class="hidden tabular-nums md:table-cell" :class="CELL">
                  {{ mib(row.storageUsed) }} / {{ mib(row.storageLimit) }}
                  <span class="text-muted"
                    >·
                    {{
                      $t('admin.quota.percent', {
                        percent: percentOf(row.storageUsed, row.storageLimit),
                      })
                    }}</span
                  >
                </td>
                <td class="py-2 text-right">
                  <button
                    type="button"
                    :class="ADMIN_BUTTON_CLASS"
                    :aria-label="$t('admin.quota.editLabel', { name: row.name })"
                    @click="openEdit(row)"
                  >
                    {{ $t('admin.quota.edit') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <NumberedPager v-if="data" :meta="data.meta" :label="$t('admin.quota.pager')" />
      </QueryState>
    </section>
    <QuotaEditDialog
      v-model:visible="isEditOpen"
      :slug="editing?.slug ?? null"
      :name="editing?.name ?? ''"
      @saved="onSaved(editing?.name ?? '')"
    />
  </div>
</template>
