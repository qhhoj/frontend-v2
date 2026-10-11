<script setup lang="ts">
import UserLink from '@/components/UserLink.vue';
import { computed } from 'vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useHomeQuery } from './community.queries';
import CommunityCard from './CommunityCard.vue';

/** The users with the most contribution points, ranked in the order the API gives them. */
const props = defineProps<{ limit: number; embedded?: boolean }>();
const locale = useLocaleStore();
const { data: home, isPending, error, refetch } = useHomeQuery();
const contributors = computed(() => (home.value?.topContributors ?? []).slice(0, props.limit));
</script>

<template>
  <CommunityCard
    :title="$t('blog.topContributors')"
    :embedded="embedded"
    :loading="isPending"
    :error="error"
    @retry="refetch()"
  >
    <template #skeleton>
      <div v-for="row in 3" :key="row" class="flex items-center gap-2.5">
        <SkeletonBlock round class="size-7" />
        <SkeletonBlock pill class="h-4 w-2/3" />
      </div>
    </template>
    <ol class="flex flex-col gap-3">
      <li
        v-for="(user, index) in contributors"
        :key="user.username"
        class="flex items-center gap-2.5"
      >
        <span class="w-5 shrink-0 text-right font-mono text-sm tabular-nums text-muted">
          {{ index + 1 }}
        </span>
        <UserLink :username="user.username" :rating="user.rating" size="sm" class="flex-1" />
        <span class="shrink-0 font-mono text-sm tabular-nums">
          {{ formatNumber(user.contributionPoints, locale.locale) }}
        </span>
      </li>
    </ol>
    <template #footer>
      <RouterLink
        :to="{ name: 'users', query: { sort: 'contributionPoints' } }"
        class="font-semibold text-accent-text hover:underline"
      >
        {{ $t('blog.toLeaderboard') }}
      </RouterLink>
    </template>
  </CommunityCard>
</template>
