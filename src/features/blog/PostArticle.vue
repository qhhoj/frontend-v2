<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';
import UserContent from '@/components/UserContent.vue';
import UserName from '@/components/UserName.vue';
import VoteControl from '@/components/VoteControl.vue';
import type { PostDetail } from '@/api/types/blog';
import type { VoteScore } from '@/api/types/votes';
import { votePost } from '@/api/blog.api';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { formatNumericDate } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';

/** A whole post: its chips and title, the byline, the sanitized body, then the vote and the comment link. */
const props = defineProps<{ post: PostDetail }>();
const session = useSessionStore();
const locale = useLocaleStore();
const queryClient = useQueryClient();
const isAuthor = computed(() =>
  props.post.authors.some((author) => author.id === session.user?.id),
);
const canVote = computed(() => session.user !== null && !isAuthor.value);
const publishedOn = computed(() => formatNumericDate(props.post.publishOn, locale.locale));
const send = (score: VoteScore) => votePost(props.post.id, score);
const refreshPosts = () => queryClient.invalidateQueries({ queryKey: ['posts'] });
const CHIP = 'inline-flex rounded-pill px-2.5 py-0.5 text-xs font-semibold';
</script>

<template>
  <article class="flex min-w-0 flex-col gap-5">
    <header data-testid="post-header" class="flex flex-col gap-3">
      <div v-if="post.organization || post.sticky" class="flex flex-wrap items-center gap-2">
        <RouterLink
          v-if="post.organization"
          :to="{ name: 'organization', params: { slug: post.organization.slug } }"
          :class="`${CHIP} border border-line text-content hover:bg-surface-hover`"
        >
          {{ post.organization.shortName }}
        </RouterLink>
        <span v-if="post.sticky" :class="`${CHIP} bg-accent-soft text-accent-soft-text`">
          {{ $t('blogPost.pinned') }}
        </span>
      </div>
      <h1
        class="font-display text-3xl font-bold tracking-tight [overflow-wrap:anywhere] sm:text-4xl"
      >
        {{ post.title }}
      </h1>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
        <span
          v-for="author in post.authors"
          :key="author.id"
          class="inline-flex items-center gap-2"
        >
          <UserAvatar :username="author.username" :size="28" />
          <UserName :username="author.username" />
        </span>
        <time :datetime="post.publishOn">{{ publishedOn }}</time>
      </div>
    </header>
    <UserContent :html="post.contentHtml" />
    <footer
      data-testid="post-actions"
      class="flex flex-wrap items-center gap-4 border-t border-line pt-4"
    >
      <VoteControl
        orientation="row"
        :score="post.score"
        :viewer-vote="post.viewerVote"
        :can-vote="canVote"
        :send="send"
        @voted="refreshPosts"
      />
      <RouterLink
        :to="{ name: 'post', params: { id: post.id }, hash: '#comments' }"
        class="font-semibold text-accent-text hover:underline"
      >
        {{ $t('blogPost.comments', { count: post.commentCount }) }}
      </RouterLink>
    </footer>
  </article>
</template>
