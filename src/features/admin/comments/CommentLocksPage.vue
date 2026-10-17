<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { LockOpen } from 'lucide-vue-next';
import type { CommentPageLink } from '@/api/types/comments';
import { commentPageRoute } from '@/lib/comment-links';
import { pageFromQuery } from '@/lib/paging';
import CommentsSectionHeader from './CommentsSectionHeader.vue';
import { failureTextOf } from '../ui/admin-errors';
import { buttonClass } from '../ui/controls';
import AdminNotice from '../ui/feedback/AdminNotice.vue';
import { useAdminToast } from '../ui/feedback/use-admin-toast';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import type { AdminColumn } from '../ui/table/table-columns';
import { useCommentLocksQuery, useUnlockPage } from './comment-locks.queries';

/** Legacy `CommentLockAdmin` (`judge.change_comment`): every page whose comments are locked, newest lock first; unlock from here. */
const { t } = useI18n();
const toast = useAdminToast();
const route = useRoute();
const page = computed(() => pageFromQuery(route.query.page));
const { data, isPending, error, refetch } = useCommentLocksQuery(page);
const items = computed(() => data.value?.items ?? []);
const unlock = useUnlockPage();
const keyOf = (link: CommentPageLink) => `${link.type}:${link.key}`;
const columns = computed<AdminColumn[]>(() => [
  { key: 'title', label: t('admin.comments.locks.columns.page'), priority: 'primary' },
  { key: 'type', label: t('admin.comments.locks.columns.type') },
  { key: 'key', label: t('admin.comments.locks.columns.key'), cellClass: 'font-mono' },
]);

async function unlockPage(link: CommentPageLink) {
  if (unlock.isPending.value) return;
  await unlock.run(link);
  if (unlock.isDone.value)
    toast.show({ text: t('admin.comments.locks.unlocked', { title: link.title }) });
}
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <CommentsSectionHeader :lead="$t('admin.comments.locks.lead')" />
    <AdminNotice
      v-if="unlock.failure.value"
      tone="danger"
      :title="failureTextOf(unlock.failure.value)"
    />
    <AdminDataTable
      :pager="data?.meta ? { meta: data.meta, label: $t('admin.comments.locks.pager') } : undefined"
      :columns="columns"
      :rows="items"
      :row-key="keyOf"
      :row-label="(link) => link.title"
      :label="$t('admin.comments.locks.title')"
      :loading="isPending"
      :error="error"
      :empty-text="$t('admin.comments.locks.empty')"
      @retry="refetch()"
    >
      <template #cell-title="{ row }">
        <RouterLink
          v-if="commentPageRoute(row)"
          :to="commentPageRoute(row)!"
          class="font-semibold text-accent-text hover:underline"
        >
          {{ row.title }}
        </RouterLink>
        <span v-else class="font-semibold">{{ row.title }}</span>
      </template>
      <template #cell-type="{ row }">{{ $t(`admin.comments.all.pageTypes.${row.type}`) }}</template>
      <template #actions="{ row }">
        <button
          type="button"
          :class="buttonClass('secondary', 'sm')"
          :aria-label="$t('admin.comments.locks.unlockNamed', { title: row.title })"
          :aria-disabled="unlock.isPending.value || undefined"
          @click="unlockPage(row)"
        >
          <LockOpen aria-hidden="true" class="size-4" :stroke-width="1.75" />
          {{ $t('admin.comments.locks.unlock') }}
        </button>
      </template>
    </AdminDataTable>
  </div>
</template>
