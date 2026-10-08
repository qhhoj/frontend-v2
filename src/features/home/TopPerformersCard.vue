<script setup lang="ts">
import { computed } from 'vue';
import StateBit from '@/components/StateBit.vue';
import UserName from '@/components/UserName.vue';
import CommunityCard from '@/features/community/CommunityCard.vue';
import { useHomeQuery } from '@/features/community/community.queries';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

const PERFORMER_COUNT = 5;
/** Ranks 1-3 carry the decorative rising-arrow Bit, as on the leaderboard. */
const MEDALLED_RANKS = 3;
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
        <span class="w-5 shrink-0 text-right font-mono text-sm tabular-nums text-muted">
          {{ index + 1 }}
        </span>
        <StateBit v-if="index < MEDALLED_RANKS" variant="rankUp" size="tiny" />
        <UserAvatar :username="entry.username" :size="28" />
        <div class="flex min-w-0 flex-1 flex-col">
          <UserName :username="entry.username" :rating="entry.rating" class="truncate" />
          <span v-if="entry.organization" class="truncate text-xs text-muted">
            {{ entry.organization.shortName }}
          </span>
        </div>
        <span class="shrink-0 font-mono text-sm tabular-nums">
          {{ $t('home.anon.pp', { pp: formatNumber(entry.performancePoints, locale.locale) }) }}
        </span>
      </li>
    </ol>
    <template #footer>
      <RouterLink
        :to="{ name: 'users', query: { sort: 'performancePoints' } }"
        class="font-semibold text-accent-text hover:underline"
      >
        {{ $t('home.anon.leaderboard') }}
      </RouterLink>
    </template>
  </CommunityCard>
</template>
