<script setup lang="ts">
import type { PostListItem } from '@/api/types/blog';
import { formatDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminStatus from '../ui/AdminStatus.vue';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import type { ModerationFeed, RowFailure } from './moderation';

/** `rowFailure`: the text of a failed write, shown in the row of the post it was for. */
defineProps<{
  posts: PostListItem[];
  feed: ModerationFeed;
  rowFailure: RowFailure | null;
}>();
defineEmits<{ hide: [post: PostListItem] }>();
const locale = useLocaleStore();
const CELL = 'px-3 py-3 align-top';
const CHIP = 'rounded-pill bg-surface-hover px-2.5 py-0.5 text-xs font-semibold';
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[46rem] text-sm">
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
              <span v-if="feed === 'hidden'" :class="CHIP">{{
                $t('admin.posts.chips.hidden')
              }}</span>
            </div>
          </td>
          <td :class="CELL">
            <div class="flex flex-col gap-1.5">
              <AdminUserLabel
                v-for="author in post.authors"
                :key="author.id"
                :username="author.username"
              />
            </div>
          </td>
          <td :class="`${CELL} whitespace-nowrap`">
            {{ formatDateTime(post.publishOn, locale.locale) }}
          </td>
          <td :class="`${CELL} tabular-nums`">{{ post.score }}</td>
          <td :class="`${CELL} tabular-nums`">{{ post.commentCount }}</td>
          <td :class="CELL">
            <button
              v-if="feed !== 'hidden'"
              type="button"
              :class="ADMIN_BUTTON_CLASS"
              @click="$emit('hide', post)"
            >
              {{ $t('admin.posts.hide.action') }}
            </button>
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
