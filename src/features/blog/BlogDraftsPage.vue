<script setup lang="ts">
import { ArrowLeft, Pencil } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import GlassCard from '@/components/GlassCard.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import StatePanel from '@/components/StatePanel.vue';
import { formatDateTime } from '@/lib/format';
import { pageFromQuery } from '@/lib/paging';
import { useLocaleStore } from '@/stores/locale.store';
import { useMyDraftsQuery } from './blog.queries';
import { postStateOf, WRITE_BUTTON_CLASS } from './post-state';

/** `/blog/drafts`: the viewer's drafts and scheduled posts, each opening in the editor. */
const route = useRoute();
const locale = useLocaleStore();
const page = computed(() => pageFromQuery(route.query.page));
const { data, isPending, error, refetch } = useMyDraftsQuery(page);
const posts = computed(() => data.value?.items ?? []);
</script>

<template>
  <div class="page-column">
    <header class="flex flex-col gap-2">
      <RouterLink
        :to="{ name: 'blog' }"
        class="inline-flex w-fit items-center gap-2 text-sm font-semibold text-accent-text hover:underline"
      >
        <ArrowLeft aria-hidden="true" class="size-4" />
        {{ $t('nav.blog') }}
      </RouterLink>
      <h1 class="page-title">{{ $t('blog.drafts.title') }}</h1>
      <p class="text-muted">{{ $t('blog.drafts.lead') }}</p>
    </header>
    <GlassCard as="div" class="overflow-hidden">
      <QueryState :loading="isPending" :error="error" @retry="refetch()">
        <template #skeleton><SkeletonBlock class="h-40 w-full" /></template>
        <StatePanel v-if="!posts.length" kind="communityEmpty" :title="$t('blog.drafts.empty')">
          <RouterLink :to="{ name: 'post-new' }" :class="WRITE_BUTTON_CLASS">
            <Pencil aria-hidden="true" class="size-4" />
            {{ $t('blog.write') }}
          </RouterLink>
        </StatePanel>
        <ul v-else class="divide-y divide-line">
          <li
            v-for="post in posts"
            :key="post.id"
            data-testid="draft-row"
            class="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-4 sm:px-5"
          >
            <span
              class="inline-flex rounded-pill px-2.5 py-0.5 text-xs font-semibold"
              :class="
                postStateOf(post) === 'draft'
                  ? 'bg-surface-hover text-muted'
                  : 'bg-accent-soft text-accent-soft-text'
              "
            >
              {{ $t(`blog.drafts.state.${postStateOf(post)}`) }}
            </span>
            <RouterLink
              :to="{ name: 'post-edit', params: { id: post.id } }"
              class="min-w-0 flex-1 basis-60 font-semibold [overflow-wrap:anywhere] hover:underline"
            >
              {{ post.title }}
            </RouterLink>
            <time :datetime="post.publishOn" class="text-sm text-muted">
              {{
                postStateOf(post) === 'scheduled'
                  ? $t('blog.drafts.publishesAt', {
                      time: formatDateTime(post.publishOn, locale.locale),
                    })
                  : formatDateTime(post.publishOn, locale.locale)
              }}
            </time>
          </li>
        </ul>
        <NumberedPager
          v-if="data && posts.length"
          class="p-4"
          :meta="data.meta"
          :label="$t('blog.pager')"
        />
      </QueryState>
    </GlassCard>
  </div>
</template>
