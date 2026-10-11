<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';
import UserLink from '@/components/UserLink.vue';
import VoteControl from '@/components/VoteControl.vue';
import type { PostListItem } from '@/api/types/blog';
import type { VoteScore } from '@/api/types/votes';
import { votePost } from '@/api/blog.api';
import { formatNumericDate } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { summaryExcerpt } from './post-summary';

/** One post as a row: a two-line title, a muted two-line excerpt, then author, date and comments, with the vote centred on the right. */
const props = defineProps<{ post: PostListItem }>();
const session = useSessionStore();
const locale = useLocaleStore();
const queryClient = useQueryClient();
const isAuthor = computed(() =>
  props.post.authors.some((author) => author.id === session.user?.id),
);
const canVote = computed(() => session.user !== null && !isAuthor.value);
const excerpt = computed(() => summaryExcerpt(props.post.summaryHtml));
const send = (score: VoteScore) => votePost(props.post.id, score);
const refreshPosts = () => queryClient.invalidateQueries({ queryKey: ['posts'] });
</script>

<template>
  <article
    data-testid="post-row"
    class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-4 sm:px-5 sm:py-5"
  >
    <div class="flex min-w-0 flex-col gap-2">
      <h2 class="line-clamp-2 text-lg leading-snug font-semibold [overflow-wrap:anywhere]">
        <span
          v-if="post.sticky"
          class="mr-2 inline-flex rounded-pill bg-accent-soft px-2.5 py-0.5 align-middle text-xs font-semibold text-accent-soft-text"
        >
          {{ $t('blog.pinned') }}
        </span>
        <RouterLink :to="{ name: 'post', params: { id: post.id } }" class="hover:underline">
          {{ post.title }}
        </RouterLink>
      </h2>
      <p v-if="excerpt" class="line-clamp-2 leading-6 text-muted [overflow-wrap:anywhere]">
        {{ excerpt }}
      </p>
      <footer class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
        <UserLink
          v-for="author in post.authors"
          :key="author.id"
          :username="author.username"
          :rating="author.rating"
        />
        <time :datetime="post.publishOn">
          {{ formatNumericDate(post.publishOn, locale.locale) }}
        </time>
        <RouterLink
          :to="{ name: 'post', params: { id: post.id }, hash: '#comments' }"
          class="hover:underline"
        >
          {{ $t('blog.comments', { count: post.commentCount }) }}
        </RouterLink>
      </footer>
    </div>
    <VoteControl
      orientation="row"
      :score="post.score"
      :viewer-vote="post.viewerVote"
      :can-vote="canVote"
      :send="send"
      @voted="refreshPosts"
    />
  </article>
</template>
