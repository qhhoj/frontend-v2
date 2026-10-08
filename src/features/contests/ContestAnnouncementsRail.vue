<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { ContestDetail } from '@/api/types/contests';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AnnouncementItem from './AnnouncementItem.vue';
import { isUnread, loadSeenAnnouncement, seenAnnouncementId } from './announcement-seen';
import { useContestAnnouncementsQuery } from './contests.queries';

const props = defineProps<{ contest: ContestDetail }>();
const key = computed(() => props.contest.key);
watch(key, loadSeenAnnouncement, { immediate: true });
const FIRST_PAGE = 1;
const RAIL_SIZE = 3;
const { data, isPending, isSuccess } = useContestAnnouncementsQuery(key, ref(FIRST_PAGE));
const latest = computed(() => (data.value?.items ?? []).slice(0, RAIL_SIZE));
</script>

<template>
  <GlassCard class="p-5">
    <div class="mb-1 flex items-center justify-between gap-3">
      <h2 class="font-display text-lg font-semibold">{{ $t('contests.tabs.announcements') }}</h2>
      <span
        v-if="contest.phase === 'running'"
        class="rounded-pill bg-verdict-ac-bg px-2.5 text-[12px] font-semibold text-verdict-ac"
        >{{ $t('contests.announcements.live') }}</span
      >
    </div>
    <div v-if="isPending" data-skeleton-region="announcement-rail" class="flex flex-col gap-2 py-3">
      <SkeletonBlock text class="w-2/3" />
      <SkeletonBlock text class="w-full" />
    </div>
    <EmptyState v-else-if="isSuccess && !latest.length" compact>
      {{ $t('contests.announcements.empty') }}
    </EmptyState>
    <AnnouncementItem
      v-for="item in latest"
      :key="item.id"
      :announcement="item"
      :is-unread="isUnread(item, seenAnnouncementId(contest.key))"
      is-compact
    />
    <RouterLink
      :to="{ name: 'contest-announcements', params: { key: contest.key } }"
      class="inline-flex min-h-11 items-center text-accent-text underline"
      >{{ $t('common.viewAll') }}</RouterLink
    >
  </GlassCard>
</template>
