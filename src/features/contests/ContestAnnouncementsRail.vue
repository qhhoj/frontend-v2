<script setup lang="ts">
import Chip from '@/components/ui/Chip.vue';
import { computed, ref, watch } from 'vue';
import { ANNOUNCEMENT_FIRST_PAGE } from '@/api/contests.api';
import type { ContestDetail } from '@/api/types/contests';
import EmptyState from '@/components/EmptyState.vue';
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useViewerId } from '@/stores/use-viewer-id';
import AnnouncementItem from './AnnouncementItem.vue';
import { isUnread, loadSeenAnnouncement, seenAnnouncementId } from './announcement-seen';
import { useContestAnnouncementsQuery } from './contests.queries';
import { isAnnouncementStreamPaused } from './use-announcement-feed';

const props = defineProps<{ contest: ContestDetail }>();
const key = computed(() => props.contest.key);
const viewerId = useViewerId();
watch([viewerId, key], ([viewer, contestKey]) => loadSeenAnnouncement(viewer, contestKey), {
  immediate: true,
});
const RAIL_SIZE = 3;
const { data, isPending, isSuccess } = useContestAnnouncementsQuery(
  key,
  ref(ANNOUNCEMENT_FIRST_PAGE),
);
const latest = computed(() => (data.value?.items ?? []).slice(0, RAIL_SIZE));
/** "Trực tiếp" claims a live stream: not while the stream is down. */
const isLive = computed(
  () => props.contest.phase === 'running' && !isAnnouncementStreamPaused(key.value),
);
</script>

<template>
  <Card class="p-5">
    <div class="mb-1 flex items-center justify-between gap-3">
      <h2 class="font-display text-base font-bold">{{ $t('contests.tabs.announcements') }}</h2>
      <Chip v-if="isLive" tone="success">{{ $t('contests.announcements.live') }}</Chip>
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
      :is-unread="isUnread(item, seenAnnouncementId(viewerId, contest.key))"
      is-compact
    />
    <RouterLink
      :to="{ name: 'contest-announcements', params: { key: contest.key } }"
      class="inline-flex min-h-11 items-center text-accent-text underline"
      >{{ $t('common.viewAll') }}</RouterLink
    >
  </Card>
</template>
