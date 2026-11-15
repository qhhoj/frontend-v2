<script setup lang="ts">
import CompactListRow from '@/components/CompactListRow.vue';
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import UserName from '@/components/UserName.vue';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { useOrganization } from './use-organization';
import { useOrganizationPostsQuery } from './organizations.queries';

/**
 * The about tab shows the organization's two newest posts; the posts tab lists the rest. Without posts the card is left out
 *, unless `keepsEmpty` (an administrator, who writes them from the posts tab it links to).
 */
const props = defineProps<{ keepsEmpty: boolean }>();
const RECENT_POST_COUNT = 2;
const { slug } = useOrganization();
const locale = useLocaleStore();
const query = useOrganizationPostsQuery(slug, 1);
const posts = computed(() => (query.data.value?.items ?? []).slice(0, RECENT_POST_COUNT));
const isEmpty = computed(() => query.isSuccess.value && posts.value.length === 0);
</script>

<template>
  <section v-if="!isEmpty || props.keepsEmpty" class="flex flex-col gap-2">
    <div class="flex items-baseline justify-between gap-3">
      <h2 class="section-title">{{ $t('orgs.posts') }}</h2>
      <RouterLink
        :to="{ name: 'organization-posts', params: { slug } }"
        class="text-sm font-semibold text-accent-text hover:underline"
      >
        {{ $t('common.viewAll') }}
      </RouterLink>
    </div>
    <QueryState
      :loading="query.isPending.value"
      :error="query.error.value"
      @retry="query.refetch()"
    >
      <template #skeleton>
        <div class="flex flex-col gap-3">
          <SkeletonBlock v-for="row in 2" :key="row" text class="h-6 w-full" />
        </div>
      </template>
      <p v-if="posts.length === 0" class="text-sm text-muted">{{ $t('orgs.noPosts') }}</p>
      <ul
        v-else
        class="m-0 list-none overflow-hidden rounded-row border border-line bg-surface-solid p-0"
      >
        <CompactListRow
          v-for="post in posts"
          :key="post.id"
          :to="{ name: 'post', params: { id: post.id } }"
          :title="post.title"
        >
          <template #meta>
            <UserName
              v-if="post.authors[0]"
              :username="post.authors[0].username"
              :rating="post.authors[0].rating"
              class="relative"
            />
            · {{ formatDate(post.publishOn, 'date', locale.locale) }} ·
            {{
              $t('orgs.postStats', {
                score: formatNumber(post.score, locale.locale),
                comments: formatNumber(post.commentCount, locale.locale),
              })
            }}
          </template>
        </CompactListRow>
      </ul>
    </QueryState>
  </section>
</template>
