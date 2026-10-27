<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import AppButton from '@/components/ui/AppButton.vue';
import CommentsSection from '@/features/comments/CommentsSection.vue';
import { usePageTitle } from '@/router/page-title';
import AuthorCard from './AuthorCard.vue';
import MorePostsCard from './MorePostsCard.vue';
import PostActions from './PostActions.vue';
import PostArticle from './PostArticle.vue';
import PostArticleSkeleton from './PostArticleSkeleton.vue';
import { usePostQuery } from './blog.queries';

const route = useRoute();
const id = computed(() => String(route.params.id));
const { data: post, isPending, error, refetch } = usePostQuery(id);
const isNotFound = computed(() => error.value instanceof ApiError && error.value.status === 404);
const author = computed(() => post.value?.authors[0] ?? null);
usePageTitle(() => post.value?.title);
</script>

<template>
  <div class="page-column">
    <StatePanel
      v-if="isNotFound"
      kind="notFound"
      is-page-heading
      :title="$t('blogPost.notFoundTitle')"
      :body="$t('blogPost.notFoundBody')"
    >
      <AppButton :to="{ name: 'blog' }">{{ $t('blogPost.backToBlog') }}</AppButton>
    </StatePanel>
    <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><PostArticleSkeleton /></template>
      <div v-if="post" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_var(--qh-sidebar-width)]">
        <div class="flex min-w-0 flex-col gap-6">
          <nav
            :aria-label="$t('blogPost.breadcrumb')"
            class="flex min-w-0 items-center gap-2 text-sm text-muted"
          >
            <RouterLink :to="{ name: 'blog' }" class="shrink-0 hover:underline">
              {{ $t('nav.blog') }}
            </RouterLink>
            <span aria-hidden="true">/</span>
            <span class="truncate text-content">{{ post.title }}</span>
          </nav>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <RouterLink
              :to="{ name: 'blog' }"
              class="inline-flex w-fit items-center gap-2 font-semibold text-accent-text hover:underline"
            >
              <ArrowLeft aria-hidden="true" class="size-4" />
              {{ $t('blogPost.back') }}
            </RouterLink>
            <PostActions :post="post" />
          </div>
          <PostArticle :post="post" />
          <CommentsSection :key="post.id" type="blog" :page-key="post.id" class="mt-8" />
        </div>
        <aside v-if="author" class="flex flex-col gap-6">
          <AuthorCard :username="author.username" />
          <MorePostsCard :username="author.username" :exclude-id="post.id" />
        </aside>
      </div>
    </QueryState>
  </div>
</template>
