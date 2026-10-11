<script setup lang="ts">
import OrganizationLogo from '@/features/organizations/OrganizationLogo.vue';
import { computed } from 'vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import UserContent from '@/components/UserContent.vue';
import { useActivityQuery, useRatingHistoryQuery } from '@/features/users/users.queries';
import { ratedHistory } from '@/lib/rating-chart';
import ActivityHeatmap from './ActivityHeatmap.vue';
import ProfileOverviewSkeleton from './ProfileOverviewSkeleton.vue';
import ProfileStats from './ProfileStats.vue';
import RatingChart from './RatingChart.vue';
import RecentContests from './RecentContests.vue';
import { useProfileUser } from './use-profile-user';

/** Stats come first on a phone (`order-first`) and sit beside the main column from `lg` up. */
const { username, query } = useProfileUser();
const { data: user } = query;
const {
  data: ratingHistory,
  isPending: ratingsPending,
  error: ratingsError,
  refetch: refetchRatings,
} = useRatingHistoryQuery(username);
const {
  data: activity,
  isPending: activityPending,
  error: activityError,
  refetch: refetchActivity,
} = useActivityQuery(username);

const history = computed(() => ratingHistory.value ?? []);
const ratedCount = computed(() => ratedHistory(history.value).length);
</script>

<template>
  <div
    v-if="user"
    class="flex flex-col gap-6 lg:grid lg:items-start lg:grid-cols-[minmax(0,1fr)_var(--qh-sidebar-width)]"
  >
    <ProfileStats :user="user" class="order-first lg:order-none lg:col-start-2 lg:row-start-1" />

    <div class="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-span-2 lg:row-start-1">
      <GlassCard data-testid="rating-card" class="p-5">
        <h2 class="font-display text-base font-bold">{{ $t('ratingChart.title') }}</h2>
        <QueryState :loading="ratingsPending" :error="ratingsError" @retry="refetchRatings()">
          <template #skeleton><ProfileOverviewSkeleton part="chart" /></template>
          <template v-if="ratedCount > 0">
            <p class="mt-1 text-sm text-muted">
              {{ $t('profile.chartLead', { count: ratedCount }) }}
            </p>
            <RatingChart :history="history" class="mt-3 w-full" />
          </template>
          <StatePanel
            v-else
            kind="empty"
            :title="$t('profile.unratedTitle')"
            :body="$t('profile.unratedBody')"
          >
            <RouterLink
              :to="{ path: '/contests', query: { phase: 'upcoming' } }"
              class="inline-flex min-h-11 items-center rounded-pill border border-line px-5 font-semibold hover:bg-surface-hover"
            >
              {{ $t('profile.upcoming') }}
            </RouterLink>
          </StatePanel>
        </QueryState>
      </GlassCard>

      <GlassCard class="p-5">
        <h2 class="font-display text-base font-bold">{{ $t('profile.activityTitle') }}</h2>
        <QueryState :loading="activityPending" :error="activityError" @retry="refetchActivity()">
          <template #skeleton><ProfileOverviewSkeleton part="heatmap" /></template>
          <ActivityHeatmap v-if="activity" :activity="activity" class="mt-3" />
        </QueryState>
      </GlassCard>

      <QueryState :loading="ratingsPending" :error="ratingsError" @retry="refetchRatings()">
        <template #skeleton><ProfileOverviewSkeleton part="contests" /></template>
        <RecentContests :history="history" />
      </QueryState>
    </div>

    <div class="flex min-w-0 flex-col gap-6 lg:col-start-2 lg:row-start-2">
      <GlassCard v-if="user.aboutHtml" class="p-5">
        <h2 class="font-display text-base font-bold">{{ $t('profile.about') }}</h2>
        <UserContent :html="user.aboutHtml" class="mt-3" />
      </GlassCard>
      <GlassCard v-if="user.organizations.length" class="p-5">
        <h2 class="font-display text-base font-bold">{{ $t('profile.organizations') }}</h2>
        <ul class="mt-3 flex flex-col gap-1">
          <li v-for="organization in user.organizations" :key="organization.id">
            <RouterLink
              :to="{ name: 'organization', params: { slug: organization.slug } }"
              class="flex min-w-0 items-center gap-3 rounded-row p-1.5 hover:bg-surface-hover"
            >
              <OrganizationLogo :organization="organization" />
              <span class="flex min-w-0 flex-col">
                <span class="break-words font-semibold">{{ organization.name }}</span>
                <span class="truncate text-sm text-muted">{{ organization.shortName }}</span>
              </span>
            </RouterLink>
          </li>
        </ul>
      </GlassCard>
    </div>
  </div>
</template>
