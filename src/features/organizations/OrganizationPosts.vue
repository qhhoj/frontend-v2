<script setup lang="ts">
import { Pencil } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import StatePanel from '@/components/StatePanel.vue';
import PostRow from '@/features/blog/PostRow.vue';
import { useComposeOptionsQuery } from '@/features/blog/blog.queries';
import { WRITE_BUTTON_CLASS } from '@/features/blog/post-state';
import { pageFromQuery } from '@/lib/paging';
import { useOrganizationPostsQuery } from './organizations.queries';
import { useOrganization } from './use-organization';

/** The organization's posts, newest first, one page per `?page=`; those who may post for it get the write button. */
const route = useRoute();
const { slug } = useOrganization();
const page = computed(() => pageFromQuery(route.query.page));
const { data, error, isPending, refetch } = useOrganizationPostsQuery(slug, page);
const posts = computed(() => data.value?.items ?? []);
const options = useComposeOptionsQuery();
const canWrite = computed(
  () => options.data.value?.organizations.some((item) => item.slug === slug.value) ?? false,
);
const writeTo = computed(() => ({ name: 'post-new', query: { organization: slug.value } }));
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-lg font-semibold">{{ $t('orgMembership.postsTitle') }}</h2>
      <RouterLink v-if="canWrite" :to="writeTo" :class="WRITE_BUTTON_CLASS">
        <Pencil aria-hidden="true" class="size-4" />
        {{ $t('orgMembership.writePost') }}
      </RouterLink>
    </div>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><SkeletonBlock class="h-40 w-full" /></template>
      <div v-if="!posts.length" class="rounded-card border border-line bg-surface">
        <StatePanel
          kind="communityEmpty"
          :title="$t('orgMembership.noPosts')"
          :body="$t('orgMembership.noPostsBody')"
        >
          <RouterLink v-if="canWrite" :to="writeTo" :class="WRITE_BUTTON_CLASS">
            <Pencil aria-hidden="true" class="size-4" />
            {{ $t('orgMembership.writeFirstPost') }}
          </RouterLink>
        </StatePanel>
      </div>
      <div
        v-else
        class="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface"
      >
        <PostRow v-for="post in posts" :key="post.id" :post="post" />
      </div>
      <NumberedPager
        v-if="data"
        :meta="data.meta"
        :label="$t('orgMembership.postsPager')"
        class="mt-2"
      />
    </QueryState>
  </div>
</template>
