<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue';
import { computed, ref, watch } from 'vue';
import { useLeaderboardQuery } from '@/features/users/users.queries';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import LeaderboardTable from './LeaderboardTable.vue';
import MyRankLine from './MyRankLine.vue';
import UsernameJump from './UsernameJump.vue';
import { useLeaderboardRoute } from './use-leaderboard-route';

const { sort, page } = useLeaderboardRoute();
const { data, isPending, error, refetch } = useLeaderboardQuery(sort, page);
const session = useSessionStore();
const locale = useLocaleStore();
const listTop = ref<HTMLElement | null>(null);
watch(page, () => listTop.value?.scrollIntoView({ block: 'start' }));
const entries = computed(() => data.value?.items ?? []);
const total = computed(() => formatNumber(data.value?.meta.total ?? 0, locale.locale));
</script>

<template>
  <div class="page-column">
    <PageHeader :title="$t('leaderboard.title')">
      <template #lead>
        {{ $t('leaderboard.lead', { total }) }}
        <MyRankLine v-if="session.user" :sort="sort" />
      </template>
      <template #actions><UsernameJump /></template>
    </PageHeader>
    <div ref="listTop" class="min-w-0">
      <LeaderboardTable
        :entries="entries"
        :sort="sort"
        :viewer-name="session.user?.username ?? null"
        :loading="isPending"
        :error="error"
        :meta="data?.meta"
        @retry="refetch()"
      />
    </div>
  </div>
</template>
