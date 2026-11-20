<script setup lang="ts">
import Chip from '@/components/ui/Chip.vue';
import { computed, ref, watch } from 'vue';
import { ANNOUNCEMENT_FIRST_PAGE } from '@/api/contests.api';
import type { ContestDetail } from '@/api/types/contests';
import Card from '@/components/ui/Card.vue';
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
/** Shown only while the contest runs and has announcements; the Thông báo tab holds the rest. */
const RAIL_SIZE = 3;
const { data } = useContestAnnouncementsQuery(key, ref(ANNOUNCEMENT_FIRST_PAGE));
const latest = computed(() => (data.value?.items ?? []).slice(0, RAIL_SIZE));
/** "Trực tiếp" claims a live stream: not while the stream is down. */
const isLive = computed(
  () => props.contest.phase === 'running' && !isAnnouncementStreamPaused(key.value),
);
</script>

<template>
  <Card v-if="latest.length" as="aside" padding="md" data-testid="contest-announcements-rail">
    <div class="flex items-center justify-between gap-3">
      <h2 class="eyebrow">{{ $t('contests.tabs.announcements') }}</h2>
      <Chip v-if="isLive" tone="success">{{ $t('contests.announcements.live') }}</Chip>
    </div>
    <AnnouncementItem
      v-for="item in latest"
      :key="item.id"
      :announcement="item"
      :is-unread="isUnread(item, seenAnnouncementId(viewerId, contest.key))"
      is-compact
    />
    <RouterLink
      :to="{ name: 'contest-announcements', params: { key: contest.key } }"
      class="inline-flex items-center font-semibold text-accent-text hover:underline touch:min-h-11"
      >{{ $t('common.viewAll') }}</RouterLink
    >
  </Card>
</template>
