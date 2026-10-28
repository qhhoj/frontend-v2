<script setup lang="ts">
import { computed } from 'vue';
import SeeAllLink from '@/components/ui/SeeAllLink.vue';
import UserName from '@/components/UserName.vue';
import CommunityCard from '@/features/community/CommunityCard.vue';
import { useHomeQuery } from '@/features/community/community.queries';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { formatNumber } from '@/lib/format';
import { medalClass } from '@/lib/medal';
import { useLocaleStore } from '@/stores/locale.store';

const PERFORMER_COUNT = 5;
const locale = useLocaleStore();
const { data: home, isPending, error, refetch } = useHomeQuery();
const performers = computed(() => (home.value?.topPerformers ?? []).slice(0, PERFORMER_COUNT));
</script>

<template>
  <CommunityCard
    data-testid="top-performers"
    :title="$t('home.anon.topPp')"
    :loading="isPending"
    :error="error"
    @retry="refetch()"
  >
    <template #skeleton>
      <div v-for="row in 3" :key="row" class="h-7 w-full rounded-pill bg-skeleton" />
    </template>
    <p v-if="!performers.length" class="text-muted">{{ $t('home.anon.noPerformers') }}</p>
    <ol v-else class="flex flex-col gap-3">
      <li
        v-for="(entry, index) in performers"
        :key="entry.username"
        class="flex items-center gap-2.5"
      >
        <span
          class="w-5 shrink-0 text-right font-mono text-sm tabular-nums"
          :class="medalClass(index + 1) || 'text-muted'"
        >
          {{ index + 1 }}
        </span>
        <UserAvatar :username="entry.username" :size="28" />
        <div class="flex min-w-0 flex-1 flex-col">
          <UserName :username="entry.username" :rating="entry.rating" class="truncate" />
          <span v-if="entry.organization" class="truncate text-caption leading-4 text-muted">
            {{ entry.organization.shortName }}
          </span>
        </div>
        <span class="shrink-0 font-mono text-sm tabular-nums">
          {{ $t('home.anon.pp', { pp: formatNumber(entry.performancePoints, locale.locale) }) }}
        </span>
      </li>
    </ol>
    <template #footer>
      <SeeAllLink :to="{ name: 'users', query: { sort: 'performancePoints' } }">{{
        $t('home.anon.leaderboard')
      }}</SeeAllLink>
    </template>
  </CommunityCard>
</template>
