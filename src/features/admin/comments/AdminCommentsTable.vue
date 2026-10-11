<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Eye, EyeOff, Pencil } from 'lucide-vue-next';
import type { NumberedPageMeta } from '@/api/client';
import type { AdminCommentItem } from '@/api/types/comments';
import NumberedPager from '@/components/NumberedPager.vue';
import { formatDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminChip from '../ui/AdminChip.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { buttonClass } from '../ui/controls';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import AdminRowMenu from '../ui/table/AdminRowMenu.vue';
import { rangeOf } from '../ui/table/table-columns';
import type { AdminColumn } from '../ui/table/table-columns';
import CommentExcerpt from './CommentExcerpt.vue';
import CommentPlace from './CommentPlace.vue';

/** Every comment of the site: hide or show is the row's one visible action, edit sits in its "⋯" menu. */
const props = defineProps<{
  items: AdminCommentItem[];
  meta: NumberedPageMeta | undefined;
  loading: boolean;
  error: unknown;
  busy: boolean;
  filtered: boolean;
  refusalOf: (id: string) => string | null;
}>();
const selected = defineModel<Set<string>>('selected', { required: true });
const emit = defineEmits<{
  retry: [];
  'clear-filters': [];
  setHidden: [id: string, hidden: boolean];
  edit: [id: string];
}>();
const { t } = useI18n();
const locale = useLocaleStore();
const columns = computed<AdminColumn[]>(() => [
  { key: 'comment', label: t('admin.comments.columns.comment'), priority: 'primary' },
  { key: 'state', label: t('admin.comments.columns.state'), priority: 'badge' },
  { key: 'page', label: t('admin.comments.columns.page') },
  { key: 'createdAt', label: t('admin.comments.columns.createdAt'), priority: 'meta' },
]);
const range = computed(() => {
  const meta = props.meta;
  return meta && 'total' in meta
    ? rangeOf(meta.page, meta.pageSize, props.items.length, meta.total)
    : null;
});
const menuItems = (item: AdminCommentItem) => [
  {
    label: t('admin.comments.edit.action'),
    icon: Pencil,
    run: () => emit('edit', item.comment.id),
  },
];
</script>

<template>
  <AdminDataTable
    v-model:selected="selected"
    :columns="columns"
    :rows="items"
    :row-key="(item) => item.comment.id"
    :row-label="(item) => $t('admin.comments.rowName', { page: item.page.title })"
    :row-attrs="(item) => ({ 'data-comment': item.comment.id })"
    :label="$t('admin.comments.all.title')"
    selectable
    :loading="loading"
    :error="error"
    :filtered="filtered"
    :empty-text="$t('admin.comments.all.empty')"
    @retry="$emit('retry')"
    @clear-filters="$emit('clear-filters')"
  >
    <template #bulk><slot name="bulk" /></template>
    <template #cell-comment="{ row }">
      <CommentExcerpt :comment="row.comment">
        <p v-if="row.hiddenBy" class="m-0 text-xs text-muted">
          {{ $t('admin.comments.all.hiddenBy', { name: row.hiddenBy.username }) }}
        </p>
        <AdminStatus
          v-if="refusalOf(row.comment.id)"
          kind="refused"
          :text="refusalOf(row.comment.id)!"
        />
      </CommentExcerpt>
    </template>
    <template #cell-state="{ row }">
      <AdminChip v-if="row.comment.deleted" tone="neutral">
        {{ $t('admin.comments.chips.deleted') }}
      </AdminChip>
      <AdminChip v-else-if="row.comment.hidden" tone="caution" :icon="EyeOff">
        {{ $t('admin.comments.chips.hidden') }}
      </AdminChip>
      <AdminChip v-else tone="positive" :icon="Eye">
        {{ $t('admin.comments.chips.visible') }}
      </AdminChip>
    </template>
    <template #cell-page="{ row }"><CommentPlace :item="row" /></template>
    <template #cell-createdAt="{ row }">
      <span class="whitespace-nowrap">{{ formatDateTime(row.createdAt, locale.locale) }}</span>
    </template>
    <template #actions="{ row }">
      <template v-if="!row.comment.deleted">
        <button
          type="button"
          :class="buttonClass('secondary', 'sm')"
          :aria-disabled="busy || undefined"
          @click="busy || $emit('setHidden', row.comment.id, !row.comment.hidden)"
        >
          {{ row.comment.hidden ? $t('admin.comments.all.show') : $t('admin.comments.all.hide') }}
        </button>
        <AdminRowMenu
          :label="
            $t('admin.table.rowMenu', {
              name: $t('admin.comments.rowName', { page: row.page.title }),
            })
          "
          :items="menuItems(row)"
        />
      </template>
    </template>
    <template v-if="meta" #footer>
      <span v-if="range" class="font-mono tabular-nums">{{ $t('admin.table.range', range) }}</span>
      <NumberedPager class="ml-auto" compact :meta="meta" :label="$t('admin.comments.all.pager')" />
    </template>
  </AdminDataTable>
</template>
