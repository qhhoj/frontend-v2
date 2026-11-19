<script setup lang="ts">
import { computed } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AppButton from '@/components/ui/AppButton.vue';
import PageSection from '@/components/ui/PageSection.vue';
import UserLink from '@/components/UserLink.vue';
import { sortLocation } from '@/features/leaderboard/leaderboard-columns';
import { useTopContributorsQuery } from '@/features/users/users.queries';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

/** The users whose posts, comments and editorials others voted up most (`GET /contributors`); "Xem tất cả" opens the board sorted the same way. */
const locale = useLocaleStore();
const { data, isPending, error, refetch } = useTopContributorsQuery();
const contributors = computed(() => data.value ?? []);
const BOARD = { name: 'users', ...sortLocation('contributionPoints') };
</script>

<template>
  <PageSection
    data-testid="top-contributors"
    :title="$t('home.contributors.title')"
    :see-all="{ to: BOARD, label: $t('common.viewAll') }"
  >
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <div class="flex flex-col gap-3">
          <SkeletonBlock v-for="row in 3" :key="row" pill class="h-4 w-2/3" />
        </div>
      </template>
      <EmptyState v-if="!contributors.length" inline>
        {{ $t('home.contributors.empty') }}
        <template #action>
          <AppButton size="sm" to="/blog">{{ $t('home.contributors.toBlog') }}</AppButton>
        </template>
      </EmptyState>
      <ol v-else class="flex flex-col divide-y divide-line">
        <li
          v-for="entry in contributors"
          :key="entry.id"
          class="flex min-h-(--qh-row) items-center gap-3 py-2"
        >
          <span class="w-6 shrink-0 font-mono text-muted tabular-nums">{{ entry.rank }}</span>
          <UserLink
            :username="entry.username"
            :rating="entry.rating"
            size="xs"
            class="min-w-0 flex-1 truncate"
          />
          <span class="shrink-0 font-mono tabular-nums">{{
            formatNumber(entry.contributionPoints, locale.locale)
          }}</span>
        </li>
      </ol>
    </QueryState>
  </PageSection>
</template>
