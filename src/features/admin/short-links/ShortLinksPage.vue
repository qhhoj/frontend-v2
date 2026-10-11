<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { useRoute } from 'vue-router';
import { deleteShortLink } from '@/api/short-links.api';
import { translate } from '@/i18n';
import type { ShortLink } from '@/api/types/short-links';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AdminBit from '../shell/AdminBit.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import ShortLinkCreateForm from './ShortLinkCreateForm.vue';
import ShortLinksTable from './ShortLinksTable.vue';
import { shortLinksKey, useAdminShortLinksQuery } from './short-links.queries';

const route = useRoute();
const page = computed(() => Math.max(1, Number(route.query.page) || 1));
const { data, isPending, error, refetch } = useAdminShortLinksQuery(page);
const links = computed(() => data.value?.items ?? []);
/** The link waiting for "Xóa liên kết"; null closes the dialog. */
const pending = ref<ShortLink | null>(null);
const queryClient = useQueryClient();
const remove = useAdminMutation<string, void>({
  mutate: deleteShortLink,
  invalidates: () => [shortLinksKey],
  successText: (_result, code) => translate('admin.shortlinks.deleted', { code }),
  onDone: () => {
    // The copy button caches the automatic code of a page: a deleted one must not be offered again.
    queryClient.removeQueries({ queryKey: ['shortLinks'] });
    pending.value = null;
  },
});
const isConfirmOpen = computed({
  get: () => pending.value !== null,
  set: (isOpen: boolean) => {
    if (!isOpen) pending.value = null;
  },
});
function askToRemove(link: ShortLink) {
  remove.reset();
  pending.value = link;
}
const confirmRemove = () => pending.value && void remove.run(pending.value.code);
/** The row is gone after a delete: focus goes to the table. */
const tableRegion = () => document.getElementById('short-links-table');
</script>

<template>
  <div class="flex flex-col gap-5">
    <AdminPageHeader
      :title="$t('admin.shell.screens.shortLinks')"
      :lead="$t('admin.shortlinks.lead')"
    />
    <ShortLinkCreateForm />
    <ShortLinksTable
      :links="links"
      :meta="data?.meta"
      :loading="isPending"
      :error="error"
      @remove="askToRemove"
      @retry="refetch()"
    >
      <template #empty>
        <div class="flex flex-col items-center gap-3 p-6 text-center">
          <AdminBit placement="empty" />
          <p>{{ $t('admin.shortlinks.table.empty') }}</p>
        </div>
      </template>
    </ShortLinksTable>
    <ConfirmDialog
      v-model:visible="isConfirmOpen"
      tone="danger"
      :title="$t('admin.shortlinks.confirm.title', { code: pending?.code ?? '' })"
      :body="$t('admin.shortlinks.confirm.body')"
      :confirm-label="$t('admin.shortlinks.confirm.confirm')"
      :busy="remove.isPending.value"
      :return-focus-to="tableRegion"
      @confirm="confirmRemove"
    >
      <template #error>
        <AdminStatus
          v-if="remove.failure.value"
          kind="refused"
          :text="failureTextOf(remove.failure.value)"
        />
      </template>
    </ConfirmDialog>
  </div>
</template>
