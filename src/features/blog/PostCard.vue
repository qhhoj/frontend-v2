<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import { useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';
import BitLoop from '@/components/BitLoop.vue';
import UserLink from '@/components/UserLink.vue';
import VoteControl from '@/components/VoteControl.vue';
import type { PostListItem } from '@/api/types/blog';
import type { VoteScore } from '@/api/types/votes';
import { votePost } from '@/api/blog.api';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { summaryExcerpt, summaryFirstImage } from './post-summary';

/** A pinned post as a card: its first image (else a tinted block with the writing Bit), the pinned label, title, 2-line excerpt, meta and vote. */
const props = defineProps<{ post: PostListItem }>();
const session = useSessionStore();
const locale = useLocaleStore();
const queryClient = useQueryClient();
const canVote = computed(
  () =>
    session.user !== null && !props.post.authors.some((author) => author.id === session.user?.id),
);
const image = computed(() => summaryFirstImage(props.post.summaryHtml));
const excerpt = computed(() => summaryExcerpt(props.post.summaryHtml));
const send = (score: VoteScore) => votePost(props.post.id, score);
const refreshPosts = () => queryClient.invalidateQueries({ queryKey: ['posts'] });
</script>

<template>
  <Card as="article" data-testid="post-card" class="flex min-w-0 flex-col overflow-hidden">
    <RouterLink
      :to="{ name: 'post', params: { id: post.id } }"
      tabindex="-1"
      aria-hidden="true"
      class="flex h-36 shrink-0 items-center justify-center overflow-hidden bg-accent-soft"
    >
      <img v-if="image" :src="image" alt="" loading="lazy" class="size-full object-cover" />
      <BitLoop v-else kind="writing" class="[--bit-px:5px]" />
    </RouterLink>
    <div class="flex flex-1 flex-col gap-2 p-4 sm:px-5">
      <p class="text-xs font-bold tracking-wide text-accent-text uppercase">
        {{ $t('blog.pinnedLabel') }}
      </p>
      <h2
        class="line-clamp-2 max-h-[2lh] text-subtitle leading-snug font-semibold [overflow-wrap:anywhere]"
      >
        <RouterLink :to="{ name: 'post', params: { id: post.id } }" class="hover:underline">
          {{ post.title }}
        </RouterLink>
      </h2>
      <p class="line-clamp-2 h-[2lh] leading-6 text-muted [overflow-wrap:anywhere]">
        {{ excerpt }}
      </p>
      <footer class="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-sm text-muted">
        <UserLink
          v-for="author in post.authors"
          :key="author.id"
          :username="author.username"
          :rating="author.rating"
        />
        <time :datetime="post.publishOn">
          {{ formatDate(post.publishOn, 'date', locale.locale) }}
        </time>
        <RouterLink
          :to="{ name: 'post', params: { id: post.id }, hash: '#comments' }"
          class="hover:underline"
        >
          {{ $t('blog.comments', { count: post.commentCount }) }}
        </RouterLink>
        <VoteControl
          class="ml-auto"
          orientation="row"
          :score="post.score"
          :viewer-vote="post.viewerVote"
          :can-vote="canVote"
          :send="send"
          @voted="refreshPosts"
        />
      </footer>
    </div>
  </Card>
</template>
