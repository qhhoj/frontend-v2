<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { useRoute } from 'vue-router';
import { deleteShortLink } from '@/api/short-links.api';
import type { ShortLink } from '@/api/types/short-links';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import AdminBit from '../shell/AdminBit.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import ShortLinkCreateForm from './ShortLinkCreateForm.vue';
import ShortLinksTable from './ShortLinksTable.vue';
import ShortLinksTableSkeleton from './ShortLinksTableSkeleton.vue';
import { shortLinksKey, useAdminShortLinksQuery } from './short-links.queries';

const route = useRoute();
const page = computed(() => Math.max(1, Number(route.query.page) || 1));
const { data, isPending, error, refetch } = useAdminShortLinksQuery(page);
const links = computed(() => data.value?.items ?? []);
/** The link waiting for "Xóa liên kết"; null closes the dialog. */
const pending = ref<ShortLink | null>(null);
const deletedCode = ref<string | null>(null);
const queryClient = useQueryClient();
const remove = useAdminMutation<string, void>({
  mutate: deleteShortLink,
  invalidates: () => [shortLinksKey],
  onDone: (_result, code) => {
    // The copy button caches the automatic code of a page: a deleted one must not be offered again.
    queryClient.removeQueries({ queryKey: ['shortLinks'] });
    pending.value = null;
    deletedCode.value = code;
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
  deletedCode.value = null;
  pending.value = link;
}
const confirmRemove = () => pending.value && void remove.run(pending.value.code);
/** The row is gone after a delete: focus goes to the table. */
const tableRegion = () => document.getElementById('short-links-table');
</script>

<template>
  <div class="flex flex-col gap-5 px-4 py-6 sm:px-8">
    <AdminPageHeader
      :crumbs="[{ label: $t('admin.shell.groups.site') }, { label: $t('admin.shortlinks.title') }]"
      :title="$t('admin.shell.screens.shortLinks')"
      :lead="$t('admin.shortlinks.lead')"
    >
      <template #actions><AdminBit placement="header" /></template>
    </AdminPageHeader>
    <ShortLinkCreateForm />
    <AdminStatus
      v-if="deletedCode"
      kind="done"
      :text="$t('admin.shortlinks.deleted', { code: deletedCode })"
    />
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><ShortLinksTableSkeleton /></template>
      <ShortLinksTable v-if="links.length > 0" :links="links" @remove="askToRemove" />
      <section v-else class="glass flex flex-col items-center gap-3 rounded-panel p-6 text-center">
        <AdminBit placement="empty" />
        <p>{{ $t('admin.shortlinks.table.empty') }}</p>
      </section>
      <NumberedPager v-if="data" :meta="data.meta" :label="$t('admin.shortlinks.table.pager')" />
    </QueryState>
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
