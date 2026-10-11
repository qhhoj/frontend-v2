<script setup lang="ts">
import { computed } from 'vue';
import type { PostListItem } from '@/api/types/blog';
import { hasPermission } from '@/lib/permissions';
import { useSessionStore } from '@/stores/session.store';
import { formatDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminStatus from '../ui/AdminStatus.vue';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import { unhidePlanOf } from './post-visibility';
import type { ModerationFeed, PostFlags, RowFailure } from './moderation';

const props = withDefaults(
  defineProps<{
    posts: PostListItem[];
    feed: ModerationFeed;
    rowFailure: RowFailure | null;
    /** The post whose show write is running: its row action reads "Đang hiện lại" and is busy. */
    pendingPostId?: string | null;
  }>(),
  { pendingPostId: null },
);
defineEmits<{
  hide: [post: PostListItem];
  show: [post: PostListItem];
  flag: [post: PostListItem, patch: PostFlags];
}>();
const locale = useLocaleStore();
const session = useSessionStore();
const canPin = computed(() => hasPermission(session.user, 'judge.pin_post'));
const canMarkGlobal = computed(() => hasPermission(session.user, 'judge.mark_global_post'));
const CELL = 'px-3 py-3 align-top';
const CHIP = 'rounded-pill bg-surface-hover px-2.5 py-0.5 text-xs font-semibold';

const isAheadOfTime = (post: PostListItem) => unhidePlanOf(post, Date.now()).scheduled;
const isRowPending = (post: PostListItem) => props.pendingPostId === post.id;
/** One post write at a time: while one runs, every row's actions wait. */
const isBusy = computed(() => props.pendingPostId !== null);
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[56rem] text-sm">
      <caption class="sr-only">
        {{
          $t('admin.posts.table.caption')
        }}
      </caption>
      <thead>
        <tr class="border-b border-line text-left text-muted">
          <th scope="col" class="px-3 py-2 font-semibold">{{ $t('admin.posts.table.post') }}</th>
          <th scope="col" class="px-3 py-2 font-semibold">{{ $t('admin.posts.table.author') }}</th>
          <th scope="col" class="px-3 py-2 font-semibold">
            {{
              feed === 'scheduled'
                ? $t('admin.posts.table.scheduledAt')
                : $t('admin.posts.table.publishedAt')
            }}
          </th>
          <th scope="col" class="px-3 py-2 font-semibold">{{ $t('admin.posts.table.score') }}</th>
          <th scope="col" class="px-3 py-2 font-semibold">
            {{ $t('admin.posts.table.comments') }}
          </th>
          <th scope="col" class="px-3 py-2 font-semibold">{{ $t('admin.posts.table.actions') }}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-line">
        <tr v-for="post in posts" :key="post.id">
          <td :class="CELL">
            <RouterLink
              :to="{ name: 'post', params: { id: post.id } }"
              class="font-semibold hover:underline"
            >
              {{ post.title }}
            </RouterLink>
            <div class="mt-1.5 flex flex-wrap gap-1.5">
              <span v-if="post.sticky" :class="CHIP">{{ $t('admin.posts.chips.sticky') }}</span>
              <span :class="CHIP">
                {{
                  post.globalPost
                    ? $t('admin.posts.chips.global')
                    : $t('admin.posts.chips.personal')
                }}
              </span>
              <span v-if="post.score < 0" :class="CHIP">{{
                $t('admin.posts.chips.negativeScore')
              }}</span>
              <span v-if="!post.visible" :class="CHIP">{{ $t('admin.posts.chips.hidden') }}</span>
              <span v-if="!post.visible && isAheadOfTime(post)" :class="CHIP">
                {{ $t('admin.posts.chips.aheadOfTime') }}
              </span>
            </div>
          </td>
          <td :class="CELL">
            <div class="flex flex-col gap-1.5">
              <AdminUserLabel
                v-for="author in post.authors"
                :key="author.id"
                :username="author.username"
                :rating="author.rating"
              />
            </div>
          </td>
          <td :class="`${CELL} whitespace-nowrap`">
            {{ formatDateTime(post.publishOn, locale.locale) }}
          </td>
          <td :class="`${CELL} tabular-nums`">{{ post.score }}</td>
          <td :class="`${CELL} tabular-nums`">{{ post.commentCount }}</td>
          <td :class="CELL">
            <div class="flex flex-wrap gap-1.5">
              <RouterLink
                :to="{ name: 'post-edit', params: { id: post.id } }"
                :class="ADMIN_BUTTON_CLASS"
              >
                {{ $t('admin.posts.row.edit') }}
              </RouterLink>
              <button
                v-if="canPin"
                type="button"
                :class="ADMIN_BUTTON_CLASS"
                :aria-disabled="isBusy || undefined"
                @click="isBusy || $emit('flag', post, { sticky: !post.sticky })"
              >
                {{ post.sticky ? $t('admin.posts.row.unpin') : $t('admin.posts.row.pin') }}
              </button>
              <button
                v-if="canMarkGlobal"
                type="button"
                :class="ADMIN_BUTTON_CLASS"
                :aria-disabled="isBusy || undefined"
                @click="isBusy || $emit('flag', post, { globalPost: !post.globalPost })"
              >
                {{
                  post.globalPost
                    ? $t('admin.posts.row.unmarkGlobal')
                    : $t('admin.posts.row.markGlobal')
                }}
              </button>
              <button
                v-if="post.visible"
                type="button"
                :class="ADMIN_BUTTON_CLASS"
                :aria-disabled="isBusy || undefined"
                @click="isBusy || $emit('hide', post)"
              >
                {{ $t('admin.posts.hide.action') }}
              </button>
              <button
                v-else
                type="button"
                :class="ADMIN_BUTTON_CLASS"
                :disabled="isRowPending(post)"
                :aria-busy="isRowPending(post) || undefined"
                @click="$emit('show', post)"
              >
                {{
                  isRowPending(post) ? $t('admin.posts.row.unhiding') : $t('admin.posts.row.unhide')
                }}
              </button>
            </div>
            <AdminStatus
              v-if="rowFailure?.postId === post.id"
              kind="refused"
              :text="rowFailure.text"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
