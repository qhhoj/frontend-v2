<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { deleteCannedReply } from '@/api/ticket-canned-replies.api';
import type { CannedReply } from '@/api/types/tickets';
import { CANNED_REPLIES_MAX } from '@/api/types/tickets';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import QueryState from '@/components/QueryState.vue';
import { useCannedRepliesQuery } from '@/features/tickets/tickets.queries';
import { translate } from '@/i18n';
import { adminRouteName } from '../admin-screens';
import AdminBit from '../shell/AdminBit.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { isNotFound } from '../ui/admin-errors';
import { ADMIN_BUTTON_CLASS, ADMIN_DANGER_CLASS, ADMIN_PRIMARY_CLASS } from '../ui/classes';
import { useAdminMutation } from '../ui/use-admin-mutation';
import CannedRepliesSkeleton from './CannedRepliesSkeleton.vue';
import CannedReplyDialog from './CannedReplyDialog.vue';
import { cannedReplyRefusal } from './canned-reply-form';

const query = useCannedRepliesQuery(true);
const queryClient = useQueryClient();
const replies = computed(() => query.data.value?.items ?? []);
const isEditorOpen = ref(false);
const editing = ref<CannedReply | null>(null);
const isDeleteOpen = ref(false);
const deleteTarget = ref<CannedReply | null>(null);
const statusText = ref<string | null>(null);
const refusalText = ref<string | null>(null);
const addButton = ref<HTMLButtonElement | null>(null);
const reload = () => queryClient.invalidateQueries({ queryKey: ['tickets', 'canned'] });

const remove = useAdminMutation({
  mutate: (id: string) => deleteCannedReply(id),
  onDone: () => void reload(),
});

function openEditor(reply: CannedReply | null) {
  editing.value = reply;
  statusText.value = null;
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
    statusText.value = translate('admin.cannedReplies.deleted', { title: target.title });
  else refusalText.value = cannedReplyRefusal(remove.failure.value);
  if (isNotFound(remove.failure.value)) await reload();
}
const onSaved = (reply: CannedReply) =>
  (statusText.value = translate('admin.cannedReplies.saved', { title: reply.title }));
const onGone = async () => {
  isEditorOpen.value = false;
  refusalText.value = translate('admin.cannedReplies.gone');
  await reload();
};
</script>

<template>
  <div data-testid="canned-replies" class="mx-auto flex max-w-[1280px] flex-col gap-6">
    <AdminPageHeader
      :crumbs="[
        { label: $t('admin.cannedReplies.crumbs'), to: { name: adminRouteName('tickets') } },
        { label: $t('admin.cannedReplies.title') },
      ]"
      :title="$t('admin.cannedReplies.title')"
      :lead="$t('admin.cannedReplies.lead')"
    >
      <template #actions>
        <button
          ref="addButton"
          type="button"
          :class="ADMIN_PRIMARY_CLASS"
          @click="openEditor(null)"
        >
          {{ $t('admin.cannedReplies.add') }}
        </button>
        <AdminBit placement="composing" />
      </template>
    </AdminPageHeader>
    <p class="text-sm text-muted tabular-nums">
      {{ $t('admin.cannedReplies.count', { count: replies.length, max: CANNED_REPLIES_MAX }) }}
    </p>
    <AdminStatus v-if="statusText" kind="done" :text="statusText" />
    <AdminStatus v-if="refusalText" kind="refused" :text="refusalText" />
    <QueryState
      :loading="query.isPending.value"
      :error="query.error.value"
      @retry="query.refetch()"
    >
      <template #skeleton><CannedRepliesSkeleton /></template>
      <p v-if="replies.length === 0" class="flex flex-wrap items-center gap-3 text-muted">
        <AdminBit placement="empty" />
        {{ $t('admin.cannedReplies.empty') }}
      </p>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <caption class="sr-only">
            {{
              $t('admin.cannedReplies.caption')
            }}
          </caption>
          <thead class="text-muted">
            <tr>
              <th scope="col" class="px-2 py-2 font-semibold">
                {{ $t('admin.cannedReplies.columns.order') }}
              </th>
              <th scope="col" class="px-2 py-2 font-semibold">
                {{ $t('admin.cannedReplies.columns.title') }}
              </th>
              <th scope="col" class="hidden px-2 py-2 font-semibold sm:table-cell">
                {{ $t('admin.cannedReplies.columns.body') }}
              </th>
              <th scope="col" class="px-2 py-2 font-semibold">
                {{ $t('admin.cannedReplies.columns.actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="reply in replies" :key="reply.id" class="border-t border-line align-top">
              <td class="px-2 py-2 tabular-nums">{{ reply.order }}</td>
              <th scope="row" class="px-2 py-2 font-semibold">{{ reply.title }}</th>
              <td class="hidden max-w-xl px-2 py-2 text-muted sm:table-cell">
                <span class="line-clamp-2 whitespace-pre-line">{{ reply.body }}</span>
              </td>
              <td class="px-2 py-2">
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    :class="ADMIN_BUTTON_CLASS"
                    :aria-label="$t('admin.cannedReplies.editNamed', { title: reply.title })"
                    @click="openEditor(reply)"
                  >
                    {{ $t('admin.cannedReplies.edit') }}
                  </button>
                  <button
                    type="button"
                    :class="ADMIN_DANGER_CLASS"
                    :aria-label="$t('admin.cannedReplies.deleteNamed', { title: reply.title })"
                    @click="askDelete(reply)"
                  >
                    {{ $t('admin.cannedReplies.delete') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </QueryState>
    <CannedReplyDialog
      v-model:visible="isEditorOpen"
      :reply="editing"
      @saved="onSaved"
      @gone="onGone"
    />
    <ConfirmDialog
      v-model:visible="isDeleteOpen"
      :return-focus-to="() => addButton"
      tone="danger"
      :title="$t('admin.cannedReplies.deleteTitle', { title: deleteTarget?.title ?? '' })"
      :body="$t('admin.cannedReplies.deleteBody')"
      :confirm-label="$t('admin.cannedReplies.deleteConfirm')"
      :busy="remove.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
