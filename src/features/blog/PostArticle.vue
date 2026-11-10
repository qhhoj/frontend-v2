<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue';
import { useI18n } from 'vue-i18n';
import { useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';
import UserContent from '@/components/UserContent.vue';
import Chip from '@/components/ui/Chip.vue';
import UserLink from '@/components/UserLink.vue';
import { voteDisabledKey } from '@/features/vote/vote-rules';
import VoteControl from '@/components/VoteControl.vue';
import ShortLinkButton from '@/features/short-links/ShortLinkButton.vue';
import { shortLinkPath } from '@/features/short-links/short-link-path';
import type { PostDetail } from '@/api/types/blog';
import type { VoteScore } from '@/api/types/votes';
import { votePost } from '@/api/blog.api';
import PostActions from './PostActions.vue';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';

/** A whole post: its chips and title, the byline, the sanitized body, then the vote and the comment link. */
const props = defineProps<{ post: PostDetail }>();
const session = useSessionStore();
const locale = useLocaleStore();
const queryClient = useQueryClient();
const { t } = useI18n();
const isAuthor = computed(() =>
  props.post.authors.some((author) => author.id === session.user?.id),
);
const canVote = computed(() => session.user !== null && !isAuthor.value);
const publishedOn = computed(() => formatDate(props.post.publishOn, 'date', locale.locale));
const send = (score: VoteScore) => votePost(props.post.id, score);
const refreshPosts = () => queryClient.invalidateQueries({ queryKey: ['posts'] });
</script>

<template>
  <article class="flex min-w-0 flex-col gap-5">
    <PageHeader
      data-testid="post-header"
      :title="post.title"
      :crumbs="[{ label: t('nav.blog'), to: { name: 'blog' } }, { label: post.title }]"
      :back="{ to: { name: 'blog' }, label: t('blogPost.back') }"
    >
      <template v-if="post.organization || post.sticky" #above>
        <div class="flex flex-wrap items-center gap-2">
          <RouterLink
            v-if="post.organization"
            :to="{ name: 'organization', params: { slug: post.organization.slug } }"
            class="rounded-pill hover:underline"
          >
            <Chip>{{ post.organization.shortName }}</Chip>
          </RouterLink>
          <Chip v-if="post.sticky" tone="accent">{{ $t('blogPost.pinned') }}</Chip>
        </div>
      </template>
      <template #meta>
        <div data-testid="post-byline" class="flex flex-wrap items-center gap-x-4 gap-y-2">
          <UserLink
            v-for="author in post.authors"
            :key="author.id"
            :username="author.username"
            :rating="author.rating"
            size="sm"
          />
          <time :datetime="post.publishOn">{{ publishedOn }}</time>
        </div>
      </template>
      <template v-if="post.canEdit || post.canDelete" #actions
        ><PostActions :post="post"
      /></template>
    </PageHeader>
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
        :disabled-reason="$t(voteDisabledKey(session.user !== null))"
        :send="send"
        @voted="refreshPosts"
      />
      <span v-if="!canVote" class="text-meta text-muted">
        {{ $t(voteDisabledKey(session.user !== null)) }}
      </span>
      <RouterLink
        v-if="post.commentCount > 0"
        :to="{ name: 'post', params: { id: post.id }, hash: '#comments' }"
        class="font-semibold text-accent-text hover:underline"
      >
        {{ $t('blogPost.comments', { count: post.commentCount }) }}
      </RouterLink>
      <ShortLinkButton class="sm:ml-auto" :path="shortLinkPath({ kind: 'post', id: post.id })" />
    </footer>
  </article>
</template>
