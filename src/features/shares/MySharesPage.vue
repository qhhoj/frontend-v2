<script setup lang="ts">
import { Copy, Pencil, Trash2 } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { ShareListItem } from '@/api/types/shares';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import Card from '@/components/ui/Card.vue';
import Chip from '@/components/ui/Chip.vue';
import DataTable from '@/components/ui/DataTable.vue';
import type { DataTableColumn } from '@/components/ui/DataTableColumns';
import AppButton from '@/components/ui/AppButton.vue';
import Notice from '@/components/ui/Notice.vue';
import RowMenu from '@/components/ui/RowMenu.vue';
import { useToast } from '@/components/ui/use-toast';
import { translate } from '@/i18n';
import { copyText } from '@/lib/clipboard';
import { formatDate } from '@/lib/format-date';
import { pageFromQuery } from '@/lib/paging';
import { useLocaleStore } from '@/stores/locale.store';
import SettingsLayout from '@/features/account/settings/SettingsLayout.vue';
import EditShareDialog from './EditShareDialog.vue';
import { expiryMessage } from './share-expiry';
import { shareFailureOf } from './share-failure';
import { shareUrl } from './share-url';
import { useDeleteShare, useMySharesQuery } from './shares.queries';

/** `/settings/shares` ("Liên kết của tôi"): the viewer's links, newest first; the row opens the share, "Sửa" changes title and expiry. */
const route = useRoute();
const locale = useLocaleStore();
const toast = useToast();
const page = computed(() => pageFromQuery(route.query.page));
const { data, isPending, error, refetch } = useMySharesQuery(page);
const rows = computed(() => data.value?.items ?? []);
const editing = ref<ShareListItem | null>(null);
const deleting = ref<ShareListItem | null>(null);
const failureKey = ref<string | null>(null);
const remove = useDeleteShare();

const columns = computed<DataTableColumn[]>(() => [
  { key: 'title', label: translate('share.list.title'), priority: 'primary' },
  { key: 'kind', label: translate('share.list.kind'), priority: 'badge' },
  { key: 'createdAt', label: translate('share.list.createdAt'), hideBelow: 'md' },
  { key: 'expiresAt', label: translate('share.list.expiresAt') },
]);
const nameOf = (share: ShareListItem) => share.title || translate(`share.kind.${share.kind}`);

async function copyLink(share: ShareListItem) {
  const isCopied = await copyText(shareUrl(share.code));
  toast.show({ text: translate(isCopied ? 'common.copied' : 'share.list.copyFailed') });
}
const menuItems = (share: ShareListItem) => [
  { label: translate('share.link.copy'), icon: Copy, run: () => void copyLink(share) },
  {
    label: translate('share.delete.confirm'),
    icon: Trash2,
    danger: true,
    run: () => (deleting.value = share),
  },
];
async function removeShare() {
  if (!deleting.value) return;
  failureKey.value = null;
  try {
    await remove.mutateAsync(deleting.value.code);
    toast.show({ text: translate('share.delete.done') });
  } catch (failure) {
    const reason = shareFailureOf(failure);
    failureKey.value = reason.kind === 'other' ? reason.key : 'errors.generic';
  }
  deleting.value = null;
}
</script>

<template>
  <SettingsLayout>
    <Card
      padding="lg"
      class="flex flex-col gap-5 [&>header]:mb-0"
      :title="$t('share.list.heading')"
      :lead="$t('share.list.lead')"
    >
      <Notice v-if="failureKey" tone="danger">{{ $t(failureKey) }}</Notice>
      <DataTable
        :columns="columns"
        :rows="rows"
        :row-key="(share) => share.code"
        :row-to="(share) => ({ name: 'share', params: { code: share.code } })"
        :label="$t('share.list.caption')"
        :loading="isPending"
        :error="error"
        :pager="data ? { meta: data.meta, label: $t('share.list.pager') } : undefined"
        :empty-text="$t('share.list.empty')"
        @retry="refetch()"
      >
        <template #cell-title="{ row }">
          <RouterLink
            :to="{ name: 'share', params: { code: row.code } }"
            class="font-semibold [overflow-wrap:anywhere] hover:underline"
            >{{ nameOf(row) }}</RouterLink
          >
          <Chip v-if="row.takenDown" tone="warning" size="sm" class="ml-2">{{
            $t('share.list.takenDown')
          }}</Chip>
        </template>
        <template #cell-kind="{ row }">
          <Chip tone="neutral">{{ $t(`share.kind.${row.kind}`) }}</Chip>
        </template>
        <template #cell-createdAt="{ row }">{{
          formatDate(row.createdAt, 'datetime', locale.locale)
        }}</template>
        <template #cell-expiresAt="{ row }">{{
          expiryMessage(row.expiresAt, Date.now())
        }}</template>
        <template #actions="{ row }">
          <AppButton size="sm" @click="editing = row">
            <template #icon><Pencil aria-hidden="true" class="size-4" /></template>
            {{ $t('common.edit') }}
          </AppButton>
          <RowMenu
            :label="$t('common.table.rowMenu', { name: nameOf(row) })"
            :items="menuItems(row)"
          />
        </template>
        <template #emptyAction>
          <AppButton tone="primary" :to="{ name: 'paste' }">{{
            $t('share.list.newPaste')
          }}</AppButton>
        </template>
      </DataTable>
    </Card>
    <EditShareDialog
      v-if="editing"
      :visible="true"
      :share="editing"
      @update:visible="editing = null"
    />
    <ConfirmDialog
      :visible="deleting !== null"
      tone="danger"
      :title="$t('share.delete.title')"
      :body="$t('share.delete.body')"
      :confirm-label="$t('share.delete.confirm')"
      :busy="remove.isPending.value"
      @update:visible="deleting = null"
      @confirm="removeShare"
    />
  </SettingsLayout>
</template>
