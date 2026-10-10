<script setup lang="ts">
import { computed } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useNow } from '@/lib/use-now';
import { useHomeQuery } from './community.queries';
import CommunityCard from './CommunityCard.vue';
import RecentCommentRow from './RecentCommentRow.vue';

const props = defineProps<{ limit: number; embedded?: boolean }>();
const { data: home, isPending, error, refetch } = useHomeQuery();
const now = useNow();
const comments = computed(() => (home.value?.recentComments ?? []).slice(0, props.limit));
</script>

<template>
  <CommunityCard
    :title="$t('blog.recentComments')"
    :embedded="embedded"
    :loading="isPending"
    :error="error"
    @retry="refetch()"
  >
    <template #skeleton>
      <div v-for="row in 3" :key="row" class="flex flex-col gap-1.5">
        <SkeletonBlock pill class="h-4 w-4/5" />
        <SkeletonBlock pill class="h-4 w-3/5" />
      </div>
    </template>
    <EmptyState v-if="!comments.length" compact>{{ $t('blog.noComments') }}</EmptyState>
    <div v-else class="flex flex-col gap-4">
      <RecentCommentRow
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :now="now"
      />
    </div>
  </CommunityCard>
</template>
