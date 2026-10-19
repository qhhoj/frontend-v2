<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ExternalLink, Trash2 } from 'lucide-vue-next';
import type { NumberedPageMeta } from '@/api/client';
import type { ShortLink } from '@/api/types/short-links';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import AdminChip from '../ui/AdminChip.vue';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import AdminRowMenu from '../ui/table/AdminRowMenu.vue';
import type { AdminColumn } from '../ui/table/table-columns';

/** The card takes focus after a delete (`tabindex=-1`, id `short-links-table`). On a phone each link is a card. */
defineProps<{
  links: ShortLink[];
  meta?: NumberedPageMeta;
  loading: boolean;
  error: unknown;
}>();
const emit = defineEmits<{ remove: [link: ShortLink]; retry: [] }>();
const locale = useLocaleStore();
const { t } = useI18n();

const columns = computed<AdminColumn[]>(() => [
  { key: 'code', label: t('admin.shortlinks.table.code'), priority: 'primary' },
  { key: 'path', label: t('admin.shortlinks.table.path'), cellClass: 'max-w-64 truncate' },
  { key: 'expires', label: t('admin.shortlinks.table.expires') },
  { key: 'hits', label: t('admin.shortlinks.table.hits'), align: 'end' },
  { key: 'kind', label: t('admin.shortlinks.table.kind'), priority: 'meta' },
  { key: 'lastHit', label: t('admin.shortlinks.table.lastHit'), priority: 'meta' },
]);
const isExpired = (link: ShortLink) =>
  link.expiresAt !== null && new Date(link.expiresAt).getTime() < Date.now();
const dateOrDash = (value: string | null) =>
  value ? formatDate(value, 'datetime', locale.locale) : '—';
const menuItems = (link: ShortLink) => [
  { label: t('admin.shortlinks.table.open'), icon: ExternalLink, to: link.path },
  {
    label: t('admin.shortlinks.table.delete'),
    icon: Trash2,
    danger: true,
    run: () => emit('remove', link),
  },
];
</script>

<template>
  <AdminDataTable
    id="short-links-table"
    :pager="meta ? { meta, label: $t('admin.shortlinks.table.pager') } : undefined"
    data-testid="short-links-table"
    tabindex="-1"
    class="focus-visible:-outline-offset-2"
    :columns="columns"
    :rows="links"
    :row-key="(link) => link.code"
    :row-label="(link) => `/s/${link.code}`"
    :row-attrs="(link) => ({ 'data-code': link.code })"
    :label="$t('admin.shortlinks.table.caption')"
    :loading="loading"
    :error="error"
    :skeleton-rows="6"
    @retry="$emit('retry')"
  >
    <template #cell-code="{ row }">
      <span class="font-mono font-semibold">/s/{{ row.code }}</span>
    </template>
    <template #cell-path="{ row }">
      <RouterLink :to="row.path" class="font-mono text-accent-text hover:underline">{{
        row.path
      }}</RouterLink>
    </template>
    <template #cell-expires="{ row }">
      <AdminChip v-if="isExpired(row)" tone="negative" data-testid="expired-chip">
        {{ $t('admin.shortlinks.table.expired') }}
      </AdminChip>
      <span v-else-if="row.expiresAt" class="whitespace-nowrap">{{
        dateOrDash(row.expiresAt)
      }}</span>
      <span v-else class="text-muted">{{ $t('admin.shortlinks.table.never') }}</span>
    </template>
    <template #cell-hits="{ row }">{{ formatNumber(row.hits, locale.locale) }}</template>
    <template #cell-kind="{ row }">
      {{ $t(row.isAuto ? 'admin.shortlinks.table.auto' : 'admin.shortlinks.table.chosen') }}
    </template>
    <template #cell-lastHit="{ row }">
      <span class="whitespace-nowrap text-muted">{{ dateOrDash(row.lastHitAt) }}</span>
    </template>
    <template #actions="{ row }">
      <AdminRowMenu
        :label="$t('admin.table.rowMenu', { name: `/s/${row.code}` })"
        :items="menuItems(row)"
      />
    </template>
    <template #empty><slot name="empty" /></template>
  </AdminDataTable>
</template>
