<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import { usePageTitle } from '@/router/page-title';
import AuthorCard from './AuthorCard.vue';
import MorePostsCard from './MorePostsCard.vue';
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
  <div class="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-8">
    <StatePanel
      v-if="isNotFound"
      kind="notFound"
      is-page-heading
      :title="$t('blogPost.notFoundTitle')"
      :body="$t('blogPost.notFoundBody')"
    >
      <RouterLink
        :to="{ name: 'blog' }"
        class="inline-flex min-h-11 items-center rounded-pill border border-line px-5 font-semibold hover:bg-surface-hover"
      >
        {{ $t('blogPost.backToBlog') }}
      </RouterLink>
    </StatePanel>
    <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><PostArticleSkeleton /></template>
      <div v-if="post" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
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
          <RouterLink
            :to="{ name: 'blog' }"
            class="inline-flex w-fit items-center gap-2 font-semibold text-accent-text hover:underline"
          >
            <ArrowLeft aria-hidden="true" class="size-4" />
            {{ $t('blogPost.back') }}
          </RouterLink>
          <PostArticle :post="post" />
          <section id="comments" aria-labelledby="comments-heading" class="mt-8">
            <h2 id="comments-heading" class="font-display text-xl font-semibold">
              {{ $t('comments.title') }}
            </h2>
          </section>
        </div>
        <aside v-if="author" class="flex flex-col gap-6">
          <AuthorCard :username="author.username" />
          <MorePostsCard :username="author.username" :exclude-id="post.id" />
        </aside>
      </div>
    </QueryState>
  </div>
</template>
