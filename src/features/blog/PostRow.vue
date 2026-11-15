<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';
import UserLink from '@/components/UserLink.vue';
import { voteDisabledKey } from '@/features/vote/vote-rules';
import VoteControl from '@/components/VoteControl.vue';
import Chip from '@/components/ui/Chip.vue';
import type { PostListItem } from '@/api/types/blog';
import type { VoteScore } from '@/api/types/votes';
import { votePost } from '@/api/blog.api';
import { formatAgo, formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { summaryExcerpt } from './post-summary';
import { postStateOf } from './post-state';

/**
 * One post as a compact row, the whole row a link to the post: a title line (pin mark or state chip first), a muted one-line excerpt from `sm`,
 * then author, relative date (the full date on hover) and comments. The vote sits at the row's end. Author, comments and vote stay their own targets.
 */
const props = defineProps<{ post: PostListItem }>();
const session = useSessionStore();
const locale = useLocaleStore();
const queryClient = useQueryClient();
const isAuthor = computed(() =>
  props.post.authors.some((author) => author.id === session.user?.id),
);
const canVote = computed(() => session.user !== null && !isAuthor.value);
/** Lists that include unpublished posts (an organization's admins, staff) mark them. */
const unpublished = computed(() => {
  const state = postStateOf(props.post);
  return state === 'live' ? null : state;
});
const postedAgo = computed(() => formatAgo(props.post.publishOn, Date.now(), locale.locale));
const postedOn = computed(() => formatDate(props.post.publishOn, 'datetime', locale.locale));
const excerpt = computed(() => summaryExcerpt(props.post.summaryHtml));
const send = (score: VoteScore) => votePost(props.post.id, score);
const refreshPosts = () => queryClient.invalidateQueries({ queryKey: ['posts'] });
</script>

<template>
  <article
    data-testid="post-row"
    class="relative flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover sm:px-5"
  >
    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
      <h2 class="flex min-w-0 items-center gap-2 text-title leading-snug font-semibold">
        <Chip v-if="post.sticky" tone="accent" class="shrink-0" data-testid="post-pin">{{
          $t('blog.pinned')
        }}</Chip>
        <Chip v-if="unpublished" class="shrink-0">{{
          $t(`blog.drafts.state.${unpublished}`)
        }}</Chip>
        <RouterLink
          :to="{ name: 'post', params: { id: post.id } }"
          class="truncate after:absolute after:inset-0 hover:underline"
        >
          {{ post.title }}
        </RouterLink>
      </h2>
      <p v-if="excerpt" class="hidden truncate text-sm leading-5 text-muted sm:block">
        {{ excerpt }}
      </p>
      <div
        class="flex min-w-0 items-center gap-x-3 overflow-hidden whitespace-nowrap text-meta text-muted"
      >
        <span
          v-for="author in post.authors"
          :key="author.id"
          class="relative z-10 min-w-24 truncate touch:-my-3 touch:py-3"
        >
          <UserLink :username="author.username" :rating="author.rating" />
        </span>
        <time :datetime="post.publishOn" :title="postedOn" class="shrink-0">{{ postedAgo }}</time>
        <RouterLink
          :to="{ name: 'post', params: { id: post.id }, hash: '#comments' }"
          class="relative z-10 shrink-0 hover:underline touch:-my-3 touch:py-3"
        >
          {{ $t('blog.comments', { count: post.commentCount }) }}
        </RouterLink>
      </div>
    </div>
    <VoteControl
      class="relative z-10 shrink-0 [&_button]:size-9 sm:[&_button]:size-8"
      orientation="row"
      :score="post.score"
      :viewer-vote="post.viewerVote"
      :can-vote="canVote"
      :disabled-reason="$t(voteDisabledKey(session.user !== null))"
      :send="send"
      @voted="refreshPosts"
    />
  </article>
</template>
