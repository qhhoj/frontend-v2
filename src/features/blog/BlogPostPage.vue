<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import AppButton from '@/components/ui/AppButton.vue';
import CommentsSection from '@/features/comments/CommentsSection.vue';
import { usePageTitle } from '@/router/page-title';
import PostArticle from './PostArticle.vue';
import PostArticleSkeleton from './PostArticleSkeleton.vue';
import { usePostQuery } from './blog.queries';

const route = useRoute();
const id = computed(() => String(route.params.id));
const { data: post, isPending, error, refetch } = usePostQuery(id);
const isNotFound = computed(() => error.value instanceof ApiError && error.value.status === 404);
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
      <div v-if="post" class="mx-auto flex w-full max-w-[70ch] min-w-0 flex-col gap-6">
        <PostArticle :post="post" />
        <CommentsSection :key="post.id" type="blog" :page-key="post.id" />
      </div>
    </QueryState>
  </div>
</template>
