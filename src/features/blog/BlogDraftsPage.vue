<script setup lang="ts">
import { Pencil } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import GlassCard from '@/components/GlassCard.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import StatePanel from '@/components/StatePanel.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { formatDateTime } from '@/lib/format';
import { pageFromQuery } from '@/lib/paging';
import { useLocaleStore } from '@/stores/locale.store';
import { useMyDraftsQuery } from './blog.queries';
import { postStateOf } from './post-state';

/** `/blog/drafts`: the viewer's drafts and scheduled posts, each opening in the editor. */
const route = useRoute();
const locale = useLocaleStore();
const page = computed(() => pageFromQuery(route.query.page));
const { data, isPending, error, refetch } = useMyDraftsQuery(page);
const posts = computed(() => data.value?.items ?? []);
</script>

<template>
  <div class="page-column">
    <PageHeader
      :title="$t('blog.drafts.title')"
      :lead="$t('blog.drafts.lead')"
      :crumbs="[
        { label: $t('nav.blog'), to: { name: 'blog' } },
        { label: $t('blog.drafts.title') },
      ]"
      :back="{ to: { name: 'blog' }, label: $t('nav.blog') }"
    />
    <GlassCard as="div" class="overflow-hidden">
      <QueryState :loading="isPending" :error="error" @retry="refetch()">
        <template #skeleton><SkeletonBlock class="h-40 w-full" /></template>
        <StatePanel v-if="!posts.length" kind="communityEmpty" :title="$t('blog.drafts.empty')">
          <AppButton tone="primary" :to="{ name: 'post-new' }">
            <template #icon><Pencil aria-hidden="true" class="size-4" /></template>
            {{ $t('blog.write') }}
          </AppButton>
        </StatePanel>
        <ul v-else class="divide-y divide-line">
          <li
            v-for="post in posts"
            :key="post.id"
            data-testid="draft-row"
            class="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-4 sm:px-5"
          >
            <Chip :tone="postStateOf(post) === 'draft' ? 'neutral' : 'accent'">
              {{ $t(`blog.drafts.state.${postStateOf(post)}`) }}
            </Chip>
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
