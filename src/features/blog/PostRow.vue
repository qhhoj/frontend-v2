<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';
import VoteControl from '@/components/VoteControl.vue';
import UserContent from '@/components/UserContent.vue';
import UserName from '@/components/UserName.vue';
import type { PostListItem } from '@/api/types/blog';
import type { VoteScore } from '@/api/types/votes';
import { votePost } from '@/api/blog.api';
import { formatNumericDate } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';

/** One post of the blog list: its vote column, then the title, summary and footer. */
const props = defineProps<{ post: PostListItem }>();
const session = useSessionStore();
const locale = useLocaleStore();
const queryClient = useQueryClient();
const isAuthor = computed(() =>
  props.post.authors.some((author) => author.id === session.user?.id),
);
const canVote = computed(() => session.user !== null && !isAuthor.value);
const send = (score: VoteScore) => votePost(props.post.id, score);
const refreshPosts = () => queryClient.invalidateQueries({ queryKey: ['posts'] });
</script>

<template>
  <article data-testid="post-row" class="flex gap-3 px-4 py-4 sm:px-5">
    <VoteControl
      :score="post.score"
      :viewer-vote="post.viewerVote"
      :can-vote="canVote"
      :send="send"
      @voted="refreshPosts"
    />
    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <span
        v-if="post.sticky"
        class="w-fit rounded-pill bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-soft-text"
      >
        {{ $t('blog.pinned') }}
      </span>
      <h2 class="text-lg leading-snug font-semibold [overflow-wrap:anywhere]">
        <RouterLink :to="{ name: 'post', params: { id: post.id } }" class="hover:underline">
          {{ post.title }}
        </RouterLink>
      </h2>
      <UserContent :html="post.summaryHtml" class="line-clamp-3 text-muted" />
      <footer class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        <UserName v-for="author in post.authors" :key="author.id" :username="author.username" />
        <time :datetime="post.publishOn">
          {{ formatNumericDate(post.publishOn, locale.locale) }}
        </time>
        <RouterLink
          :to="{ name: 'post', params: { id: post.id }, hash: '#comments' }"
          class="font-semibold text-accent-text hover:underline"
        >
          {{ $t('blog.comments', { count: post.commentCount }) }}
        </RouterLink>
        <RouterLink
          :to="{ name: 'post', params: { id: post.id } }"
          class="font-semibold text-accent-text hover:underline"
        >
          {{ $t('blog.readMore') }}
        </RouterLink>
      </footer>
    </div>
  </article>
</template>
