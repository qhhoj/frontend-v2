<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '@/api/client';
import { ANNOUNCEMENT_FIRST_PAGE, ANNOUNCEMENT_PAGE_SIZE } from '@/api/contests.api';
import EmptyState from '@/components/EmptyState.vue';
import Card from '@/components/ui/Card.vue';
import Chip from '@/components/ui/Chip.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import SubmissionPager from '@/features/submissions/SubmissionPager.vue';
import { usePageTitle } from '@/router/page-title';
import { useViewerId } from '@/stores/use-viewer-id';
import AnnouncementItem from './AnnouncementItem.vue';
import {
  isUnread,
  loadSeenAnnouncement,
  markAnnouncementsSeen,
  seenAnnouncementId,
} from './announcement-seen';
import ContestAnnouncementComposer from './ContestAnnouncementComposer.vue';
import ContestCompactHeader from './ContestCompactHeader.vue';
import ContestNotFound from './ContestNotFound.vue';
import ContestTabs from './ContestTabs.vue';
import { useContestAnnouncementsQuery, useContestQuery } from './contests.queries';
import { isAnnouncementStreamPaused } from './use-announcement-feed';

const route = useRoute();
const router = useRouter();
const viewerId = useViewerId();
const key = computed(() => String(route.params.key));
const page = computed(() => Math.max(1, Number(route.query.page) || 1));
const { data: contest, error: contestError } = useContestQuery(key);
const { data: list, isPending, error, refetch } = useContestAnnouncementsQuery(key, page);
usePageTitle(() => contest.value?.name);
/** "Mới" marks what was new when the tab opened (per contest; the badge clears at once). */
const seenAtOpen = ref('');
watch(
  [viewerId, key],
  ([viewer, contestKey]) => {
    loadSeenAnnouncement(viewer, contestKey);
    seenAtOpen.value = seenAnnouncementId(viewer, contestKey);
  },
  { immediate: true },
);
watch(
  list,
  (value) => {
    const newest = value?.items[0];
    if (newest && page.value === ANNOUNCEMENT_FIRST_PAGE)
      markAnnouncementsSeen(viewerId.value, key.value, newest.id);
  },
  { immediate: true },
);
/** "Trực tiếp" claims a live stream: only while the contest runs and the stream is up (as on the contest page). */
const isLive = computed(
  () => contest.value?.phase === 'running' && !isAnnouncementStreamPaused(key.value),
);
const isMissing = computed(
  () => contestError.value instanceof ApiError && contestError.value.status === 404,
);
const goTo = (next: number) =>
  void router.replace({
    query: { page: next > ANNOUNCEMENT_FIRST_PAGE ? String(next) : undefined },
  });
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-8">
    <ContestNotFound v-if="isMissing" />
    <template v-else>
      <ContestTabs :contest-key="key" :phase="contest?.phase" />
      <ContestCompactHeader v-if="contest" :contest="contest" />
      <ContestAnnouncementComposer v-if="contest?.viewer.canEdit" :contest="contest" />
      <div v-if="isLive" class="flex justify-end">
        <Chip tone="success">{{ $t('contests.announcements.live') }}</Chip>
      </div>
      <QueryState :loading="isPending" :error="error" @retry="refetch()">
        <template #skeleton>
          <Card as="div" class="px-5">
            <div
              v-for="row in 3"
              :key="row"
              data-skeleton-region="announcement"
              class="flex flex-col gap-1.5 border-t border-line py-3.5 first:border-t-0"
            >
              <p class="text-caption"><SkeletonBlock text class="w-32" /></p>
              <p class="font-semibold"><SkeletonBlock text class="w-2/3" /></p>
              <SkeletonBlock text class="w-full" />
            </div>
          </Card>
        </template>
        <Card v-if="!list?.items.length" as="div">
          <EmptyState compact>{{ $t('contests.announcements.emptyPage') }}</EmptyState>
        </Card>
        <Card v-else as="div" class="px-5">
          <AnnouncementItem
            v-for="item in list.items"
            :key="item.id"
            :announcement="item"
            :is-unread="isUnread(item, seenAtOpen)"
          />
        </Card>
        <SubmissionPager
          :page="page"
          :page-size="ANNOUNCEMENT_PAGE_SIZE"
          :total="list?.meta.total"
          :item-count="list?.items.length ?? 0"
          @update:page="goTo"
        />
      </QueryState>
    </template>
  </div>
</template>
