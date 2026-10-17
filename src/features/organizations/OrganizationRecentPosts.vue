<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import UserLink from '@/components/UserLink.vue';
import { formatNumber, formatNumericDate } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useOrganization } from './use-organization';
import { useOrganizationPostsQuery } from './organizations.queries';

/**
 * The about tab shows the organization's two newest posts; the posts tab lists the rest. Without posts the card is left out
 * (P-10), unless `keepsEmpty` (an administrator, who writes them from the posts tab it links to).
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
  <Card v-if="!isEmpty || props.keepsEmpty" padding="md" class="flex flex-col gap-3">
    <h2 class="font-display text-base font-bold text-accent-text">{{ $t('orgs.posts') }}</h2>
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
      <ul v-else class="flex flex-col gap-3">
        <li v-for="post in posts" :key="post.id" class="flex flex-col gap-1">
          <RouterLink
            :to="{ name: 'post', params: { id: post.id } }"
            class="font-semibold hover:underline"
          >
            {{ post.title }}
          </RouterLink>
          <p class="flex flex-wrap gap-x-3 text-sm text-muted">
            <UserLink
              v-if="post.authors[0]"
              :username="post.authors[0].username"
              :rating="post.authors[0].rating"
            />
            <span>{{ formatNumericDate(post.publishOn, locale.locale) }}</span>
            <span>{{
              $t('orgs.postStats', {
                score: formatNumber(post.score, locale.locale),
                comments: formatNumber(post.commentCount, locale.locale),
              })
            }}</span>
          </p>
        </li>
      </ul>
    </QueryState>
    <RouterLink
      :to="{ name: 'organization-posts', params: { slug } }"
      class="font-semibold text-accent-text hover:underline"
    >
      {{ $t('common.viewAll') }}
    </RouterLink>
  </Card>
</template>
