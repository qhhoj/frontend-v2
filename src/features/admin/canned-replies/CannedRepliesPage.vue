<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Pencil, Trash2 } from 'lucide-vue-next';
import { deleteCannedReply } from '@/api/ticket-canned-replies.api';
import type { CannedReply } from '@/api/types/tickets';
import { CANNED_REPLIES_MAX } from '@/api/types/tickets';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { useCannedRepliesQuery } from '@/features/tickets/tickets.queries';
import AdminBit from '../shell/AdminBit.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import { isNotFound } from '../ui/admin-errors';
import { buttonClass } from '../ui/controls';
import AdminNotice from '../ui/feedback/AdminNotice.vue';
import { useAdminToast } from '../ui/feedback/use-admin-toast';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import AdminRowMenu from '../ui/table/AdminRowMenu.vue';
import type { AdminColumn } from '../ui/table/table-columns';
import { useAdminMutation } from '../ui/use-admin-mutation';
import CannedReplyDialog from './CannedReplyDialog.vue';
import { cannedReplyRefusal } from './canned-reply-form';

const { t } = useI18n();
const toast = useAdminToast();
const query = useCannedRepliesQuery(true);
const queryClient = useQueryClient();
const replies = computed(() => query.data.value?.items ?? []);
const isEditorOpen = ref(false);
const editing = ref<CannedReply | null>(null);
const isDeleteOpen = ref(false);
const deleteTarget = ref<CannedReply | null>(null);
const refusalText = ref<string | null>(null);
const reload = () => queryClient.invalidateQueries({ queryKey: ['tickets', 'canned'] });

const remove = useAdminMutation({
  mutate: (id: string) => deleteCannedReply(id),
  onDone: () => void reload(),
});

function openEditor(reply: CannedReply | null) {
  editing.value = reply;
  refusalText.value = null;
  isEditorOpen.value = true;
}
function askDelete(reply: CannedReply) {
  deleteTarget.value = reply;
  refusalText.value = null;
  isDeleteOpen.value = true;
}
/** A gone reply is a refusal that also reloads the list; any other refusal keeps the row. */
async function confirmDelete() {
  const target = deleteTarget.value;
  if (!target) return;
  await remove.run(target.id);
  isDeleteOpen.value = false;
  if (!remove.failure.value)
    toast.show({ text: t('admin.cannedReplies.deleted', { title: target.title }) });
  else refusalText.value = cannedReplyRefusal(remove.failure.value);
  if (isNotFound(remove.failure.value)) await reload();
}
const onSaved = (reply: CannedReply) =>
  toast.show({ text: t('admin.cannedReplies.saved', { title: reply.title }) });
const onGone = async () => {
  isEditorOpen.value = false;
  refusalText.value = t('admin.cannedReplies.gone');
  await reload();
};
const columns = computed<AdminColumn[]>(() => [
  { key: 'title', label: t('admin.cannedReplies.columns.title'), priority: 'primary' },
  { key: 'body', label: t('admin.cannedReplies.columns.body') },
  { key: 'order', label: t('admin.cannedReplies.columns.order'), align: 'end', priority: 'meta' },
]);
const menuItems = (reply: CannedReply) => [
  {
    label: t('admin.cannedReplies.delete'),
    icon: Trash2,
    danger: true,
    run: () => askDelete(reply),
  },
];
/** The table takes focus after a delete: the row the menu was in is gone. */
const tableRegion = () => document.getElementById('canned-replies-table');
</script>

<template>
  <div data-testid="canned-replies" class="flex w-full flex-col gap-4">
    <AdminPageHeader
      :title="$t('admin.cannedReplies.title')"
      :lead="$t('admin.cannedReplies.lead')"
    >
      <template #actions>
        <button type="button" :class="buttonClass('primary')" @click="openEditor(null)">
          {{ $t('admin.cannedReplies.add') }}
        </button>
      </template>
    </AdminPageHeader>
    <AdminNotice v-if="refusalText" tone="danger" :title="refusalText" />
    <AdminDataTable
      id="canned-replies-table"
      tabindex="-1"
      class="focus-visible:-outline-offset-2"
      :columns="columns"
      :rows="replies"
      :row-key="(reply) => reply.id"
      :row-label="(reply) => reply.title"
      :label="$t('admin.cannedReplies.caption')"
      :loading="query.isPending.value"
      :error="query.error.value"
      :skeleton-rows="5"
      @retry="query.refetch()"
    >
      <template #empty>
        <div class="flex flex-col items-center gap-3 p-6 text-center text-muted">
          <AdminBit placement="empty" />
          <p class="m-0">{{ $t('admin.cannedReplies.empty') }}</p>
        </div>
      </template>
      <template #cell-title="{ row }">
        <span class="font-semibold break-words">{{ row.title }}</span>
      </template>
      <template #cell-body="{ row }">
        <span class="line-clamp-2 max-w-2xl py-2 whitespace-pre-line text-muted">{{
          row.body
        }}</span>
      </template>
      <template #actions="{ row }">
        <button
          type="button"
          :class="buttonClass('secondary', 'sm')"
          :aria-label="$t('admin.cannedReplies.editNamed', { title: row.title })"
          @click="openEditor(row)"
        >
          <Pencil aria-hidden="true" class="size-4" :stroke-width="1.75" />
          {{ $t('admin.cannedReplies.edit') }}
        </button>
        <AdminRowMenu
          :label="$t('admin.table.rowMenu', { name: row.title })"
          :items="menuItems(row)"
        />
      </template>
      <template #footer>
        <span class="font-mono tabular-nums">
          {{ $t('admin.cannedReplies.count', { count: replies.length, max: CANNED_REPLIES_MAX }) }}
        </span>
      </template>
    </AdminDataTable>
    <CannedReplyDialog
      v-model:visible="isEditorOpen"
      :reply="editing"
      @saved="onSaved"
      @gone="onGone"
    />
    <ConfirmDialog
      v-model:visible="isDeleteOpen"
      :return-focus-to="tableRegion"
      tone="danger"
      :title="$t('admin.cannedReplies.deleteTitle', { title: deleteTarget?.title ?? '' })"
      :body="$t('admin.cannedReplies.deleteBody')"
      :confirm-label="$t('admin.cannedReplies.deleteConfirm')"
      :busy="remove.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
