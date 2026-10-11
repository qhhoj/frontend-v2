<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Eye, EyeOff, Megaphone, Pencil, Pin, PinOff } from 'lucide-vue-next';
import type { TotalPageMeta } from '@/api/client';
import type { PostListItem } from '@/api/types/blog';
import NumberedPager from '@/components/NumberedPager.vue';
import { hasPermission } from '@/lib/permissions';
import { formatDateTime, formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import AdminChip from '../ui/AdminChip.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { buttonClass } from '../ui/controls';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import AdminRowMenu from '../ui/table/AdminRowMenu.vue';
import type { RowMenuItem } from '../ui/table/AdminRowMenu.vue';
import { rangeOf } from '../ui/table/table-columns';
import type { AdminColumn } from '../ui/table/table-columns';
import { unhidePlanOf } from './post-visibility';
import type { ModerationFeed, PostFlags, RowFailure } from './moderation';

/**
 * The posts of one tab: hide (or show) is the row's one visible action, edit, pin and newsfeed sit in its "⋯" menu.
 * `selectable` adds the boxes of the bulk hide. On a phone each post is a card.
 */
const props = withDefaults(
  defineProps<{
    feed: ModerationFeed;
    posts: PostListItem[];
    meta: TotalPageMeta | undefined;
    loading: boolean;
    error: unknown;
    rowFailure: RowFailure | null;
    /** The post whose show write is running: its row action reads "Đang hiện lại" and is busy. */
    pendingPostId?: string | null;
    selectable?: boolean;
  }>(),
  { pendingPostId: null, selectable: false },
);
const selected = defineModel<Set<string>>('selected', { default: () => new Set<string>() });
const emit = defineEmits<{
  retry: [];
  hide: [post: PostListItem];
  show: [post: PostListItem];
  flag: [post: PostListItem, patch: PostFlags];
}>();
const { t } = useI18n();
const locale = useLocaleStore();
const session = useSessionStore();
const canPin = computed(() => hasPermission(session.user, 'judge.pin_post'));
const canMarkGlobal = computed(() => hasPermission(session.user, 'judge.mark_global_post'));

const columns = computed<AdminColumn[]>(() => [
  { key: 'post', label: t('admin.posts.table.post'), priority: 'primary' },
  { key: 'author', label: t('admin.posts.table.author') },
  {
    key: 'publishOn',
    label:
      props.feed === 'scheduled'
        ? t('admin.posts.table.scheduledAt')
        : t('admin.posts.table.publishedAt'),
    cellClass: 'whitespace-nowrap',
  },
  { key: 'score', label: t('admin.posts.table.score'), align: 'end', priority: 'meta' },
  { key: 'comments', label: t('admin.posts.table.comments'), align: 'end', priority: 'meta' },
]);

const isAheadOfTime = (post: PostListItem) => unhidePlanOf(post, Date.now()).scheduled;
const isRowPending = (post: PostListItem) => props.pendingPostId === post.id;
/** One post write at a time: while one runs, every row's actions wait. */
const isBusy = computed(() => props.pendingPostId !== null);

const menuItems = (post: PostListItem): RowMenuItem[] => [
  {
    label: t('admin.posts.row.edit'),
    icon: Pencil,
    to: { name: 'post-edit', params: { id: post.id } },
  },
  ...(canPin.value
    ? [
        {
          label: post.sticky ? t('admin.posts.row.unpin') : t('admin.posts.row.pin'),
          icon: post.sticky ? PinOff : Pin,
          disabled: isBusy.value,
          run: () => emit('flag', post, { sticky: !post.sticky }),
        },
      ]
    : []),
  ...(canMarkGlobal.value
    ? [
        {
          label: post.globalPost
            ? t('admin.posts.row.unmarkGlobal')
            : t('admin.posts.row.markGlobal'),
          icon: Megaphone,
          disabled: isBusy.value,
          run: () => emit('flag', post, { globalPost: !post.globalPost }),
        },
      ]
    : []),
];
const range = computed(() =>
  props.meta
    ? rangeOf(props.meta.page, props.meta.pageSize, props.posts.length, props.meta.total)
    : null,
);
</script>

<template>
  <AdminDataTable
    v-model:selected="selected"
    data-testid="posts-queue"
    :columns="columns"
    :rows="posts"
    :row-key="(post) => post.id"
    :row-label="(post) => post.title"
    :row-attrs="(post) => ({ 'data-post': post.id })"
    :label="$t('admin.posts.table.caption')"
    :selectable="selectable"
    :loading="loading"
    :error="error"
    :empty-text="$t('admin.posts.empty')"
    @retry="$emit('retry')"
  >
    <template #bulk="{ count }"><slot name="bulk" :count="count" /></template>
    <template #cell-post="{ row }">
      <div class="flex min-w-0 flex-col gap-1 py-2">
        <RouterLink
          :to="{ name: 'post', params: { id: row.id } }"
          class="font-semibold break-words hover:underline"
        >
          {{ row.title }}
        </RouterLink>
        <div class="flex flex-wrap gap-1">
          <AdminChip v-if="row.sticky" tone="accent" :icon="Pin">
            {{ $t('admin.posts.chips.sticky') }}
          </AdminChip>
          <AdminChip :tone="row.globalPost ? 'info' : 'neutral'">
            {{ row.globalPost ? $t('admin.posts.chips.global') : $t('admin.posts.chips.personal') }}
          </AdminChip>
          <AdminChip v-if="row.score < 0" tone="negative">
            {{ $t('admin.posts.chips.negativeScore') }}
          </AdminChip>
          <AdminChip v-if="!row.visible" tone="caution" :icon="EyeOff">
            {{ $t('admin.posts.chips.hidden') }}
          </AdminChip>
          <AdminChip v-if="!row.visible && isAheadOfTime(row)" tone="caution">
            {{ $t('admin.posts.chips.aheadOfTime') }}
          </AdminChip>
        </div>
        <AdminStatus v-if="rowFailure?.postId === row.id" kind="refused" :text="rowFailure.text" />
      </div>
    </template>
    <template #cell-author="{ row }">
      <span class="inline-flex flex-wrap gap-x-2 gap-y-1">
        <AdminUserLabel
          v-for="author in row.authors"
          :key="author.id"
          :username="author.username"
          :rating="author.rating"
        />
      </span>
    </template>
    <template #cell-publishOn="{ row }">{{
      formatDateTime(row.publishOn, locale.locale)
    }}</template>
    <template #cell-score="{ row }">{{ formatNumber(row.score, locale.locale) }}</template>
    <template #cell-comments="{ row }">{{
      formatNumber(row.commentCount, locale.locale)
    }}</template>
    <template #actions="{ row }">
      <button
        v-if="row.visible"
        type="button"
        :class="buttonClass('secondary', 'sm')"
        :aria-disabled="isBusy || undefined"
        @click="isBusy || $emit('hide', row)"
      >
        <EyeOff aria-hidden="true" class="size-4" :stroke-width="1.75" />
        {{ $t('admin.posts.hide.action') }}
      </button>
      <button
        v-else
        type="button"
        :class="buttonClass('secondary', 'sm')"
        :disabled="isRowPending(row)"
        :aria-busy="isRowPending(row) || undefined"
        @click="$emit('show', row)"
      >
        <Eye aria-hidden="true" class="size-4" :stroke-width="1.75" />
        {{ isRowPending(row) ? $t('admin.posts.row.unhiding') : $t('admin.posts.row.unhide') }}
      </button>
      <AdminRowMenu
        :label="$t('admin.table.rowMenu', { name: row.title })"
        :items="menuItems(row)"
      />
    </template>
    <template v-if="meta" #footer>
      <span v-if="range" class="font-mono tabular-nums">{{ $t('admin.table.range', range) }}</span>
      <NumberedPager class="ml-auto" compact :meta="meta" :label="$t('admin.posts.pager')" />
    </template>
  </AdminDataTable>
</template>
