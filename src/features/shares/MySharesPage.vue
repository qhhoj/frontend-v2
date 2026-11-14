<script setup lang="ts">
import { Copy, Pencil, Trash2 } from 'lucide-vue-next';
import { computed, nextTick, ref } from 'vue';
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
/** The "Sửa" button that opened the dialog: it takes focus back when the dialog closes (the dialog is unmounted by then). */
let editOpener: HTMLElement | null = null;
function openEdit(share: ShareListItem, event: MouseEvent) {
  editOpener = event.currentTarget as HTMLElement;
  editing.value = share;
}
function closeEdit() {
  editing.value = null;
  void nextTick(() => editOpener?.isConnected && editOpener.focus());
}
/** The whole row opens the share; a taken-down row has nowhere to go, so it points at this page. */
const rowTarget = (share: ShareListItem) =>
  share.takenDown ? route.fullPath : { name: 'share', params: { code: share.code } };
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
        :row-to="rowTarget"
        :label="$t('share.list.caption')"
        :loading="isPending"
        :error="error"
        :pager="data ? { meta: data.meta, label: $t('share.list.pager') } : undefined"
        :empty-text="$t('share.list.empty')"
        @retry="refetch()"
      >
        <template #cell-title="{ row }">
          <!-- A taken-down link opens to the "gone" panel for everyone but staff: no link, the reason instead. -->
          <span v-if="row.takenDown" class="flex flex-col gap-1" data-testid="share-taken-down-row">
            <span class="font-semibold [overflow-wrap:anywhere]">{{ nameOf(row) }}</span>
            <Chip tone="warning" size="sm" class="self-start">{{
              $t('share.list.takenDown')
            }}</Chip>
            <span class="text-meta text-muted [overflow-wrap:anywhere]">{{
              $t('share.list.takenDownReason', { reason: row.takenDown.reason })
            }}</span>
          </span>
          <RouterLink
            v-else
            :to="{ name: 'share', params: { code: row.code } }"
            class="font-semibold [overflow-wrap:anywhere] hover:underline"
            >{{ nameOf(row) }}</RouterLink
          >
        </template>
        <template #cell-kind="{ row }">
          <Chip tone="neutral">{{ $t(`share.kind.${row.kind}`) }}</Chip>
        </template>
        <template #cell-createdAt="{ row }"
          ><span class="whitespace-nowrap">{{
            formatDate(row.createdAt, 'datetime', locale.locale)
          }}</span></template
        >
        <template #cell-expiresAt="{ row }"
          ><span class="whitespace-nowrap">{{
            expiryMessage(row.expiresAt, Date.now())
          }}</span></template
        >
        <template #actions="{ row }">
          <template v-if="!row.takenDown">
            <AppButton size="sm" @click="openEdit(row, $event)">
              <template #icon><Pencil aria-hidden="true" class="size-4" /></template>
              {{ $t('common.edit') }}
            </AppButton>
            <RowMenu
              :label="$t('common.table.rowMenu', { name: nameOf(row) })"
              :items="menuItems(row)"
            />
          </template>
        </template>
        <template #emptyAction>
          <AppButton tone="primary" :to="{ name: 'paste' }">{{
            $t('share.list.newPaste')
          }}</AppButton>
        </template>
      </DataTable>
    </Card>
    <EditShareDialog v-if="editing" :visible="true" :share="editing" @update:visible="closeEdit" />
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
