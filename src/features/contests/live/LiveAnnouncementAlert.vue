<script setup lang="ts">
import { X } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ANNOUNCEMENT_FIRST_PAGE } from '@/api/contests.api';
import InlineBit from '@/components/InlineBit.vue';
import AppButton from '@/components/ui/AppButton.vue';
import IconButton from '@/components/ui/IconButton.vue';
import { useViewerId } from '@/stores/use-viewer-id';
import { closedAlertMarks, loadSeenAnnouncement, seenAnnouncementId } from '../announcement-seen';
import { useContestAnnouncementsQuery } from '../contests.queries';
import { useAnnouncementFeed } from '../use-announcement-feed';
import AnnouncementsPausedNotice from '../AnnouncementsPausedNotice.vue';
import { alertedAnnouncement } from './announcement-alert';
import { useStreamedContest } from './use-streamed-contest';

/**
 * P-16: the announcements of the contest the viewer is in reach every page. The app shell owns that contest's stream (its
 * contest pages leave it to the shell, `useStreamedContest`) and shows the newest unread announcement in a polite live
 * region: a toast at the bottom right on a computer, a one-row banner under the contest bar on a phone. It goes once read
 * (the Announcements tab marks it) or closed; a close is kept in storage like the read mark.
 */
const streamed = useStreamedContest();
const route = useRoute();
const viewerId = useViewerId();
const key = computed(() => streamed.contest.value?.key ?? '');
const isStreaming = computed(() => streamed.contest.value !== null);
const { message } = useAnnouncementFeed(key, isStreaming);
const { data, isPlaceholderData } = useContestAnnouncementsQuery(
  key,
  ref(ANNOUNCEMENT_FIRST_PAGE),
  isStreaming,
);
watch(
  [viewerId, key],
  ([viewer, contestKey]) => {
    if (!contestKey) return;
    loadSeenAnnouncement(viewer, contestKey);
    closedAlertMarks.load(viewer, contestKey);
  },
  { immediate: true },
);
/** Contest pages of this contest show the paused notice and their own badge; other pages get the alert's copy. */
const isOnThisContest = computed(() => route.params.key === key.value);
const isOnAnnouncementsTab = computed(
  () => isOnThisContest.value && route.name === 'contest-announcements',
);
/** A page kept from another contest (the key just changed) is never alerted under this one's name. */
const shown = computed(() =>
  isStreaming.value && !isOnAnnouncementsTab.value && !isPlaceholderData.value
    ? alertedAnnouncement(
        data.value?.items ?? [],
        seenAnnouncementId(viewerId.value, key.value),
        closedAlertMarks.get(viewerId.value, key.value),
      )
    : null,
);
/** "Đóng": kept in storage like the read mark, so a reload does not bring the same announcement back. */
const close = (id: string) => closedAlertMarks.raise(viewerId.value, key.value, id);
const announcementsTab = computed(() => ({
  name: 'contest-announcements',
  params: { key: key.value },
}));
</script>

<template>
  <!-- One polite region, there before anything arrives: the alert and the paused notice are spoken as they appear, and on the
       Announcements tab (no alert there) the new title is. Nothing in it times out. On a computer the region is the corner
       where the notice stacks above the toast. -->
  <div
    v-if="streamed.contest.value"
    data-testid="contest-announcement-live"
    role="status"
    aria-live="polite"
    class="flex flex-col md:fixed md:right-6 md:bottom-[calc(var(--dock-height,0px)+1.5rem)] md:z-toast md:w-96 md:gap-3"
  >
    <p v-if="isOnAnnouncementsTab" class="sr-only">{{ message }}</p>
    <AnnouncementsPausedNotice
      v-if="!isOnThisContest"
      :contest-key="key"
      class="max-md:page-gutter max-md:mt-3 md:mb-0 md:rounded-row md:border md:border-line md:bg-surface-solid md:p-3"
    />
    <aside
      v-if="shown"
      data-testid="announcement-alert"
      :aria-label="$t('contests.announcements.alert.label')"
    >
      <!-- Phone: one row under the contest bar; the body stays on the Announcements tab. -->
      <div
        class="flex min-h-12 items-center gap-2 border-b border-l-3 border-b-line border-l-accent bg-surface py-1 pr-2 pl-4 md:hidden"
      >
        <p class="min-w-0 flex-1 truncate text-sm">
          <span class="font-semibold">{{ $t('contests.announcements.alert.title') }}</span>
          · {{ shown.title }}
        </p>
        <AppButton size="sm" tone="ghost" :to="announcementsTab">
          {{ $t('contests.announcements.alert.view') }}
        </AppButton>
        <IconButton
          size="sm"
          :label="$t('contests.announcements.alert.close')"
          @click="close(shown.id)"
        >
          <X aria-hidden="true" class="size-4" />
        </IconButton>
      </div>
      <div
        class="flex items-start gap-3 rounded-row border border-accent bg-surface-solid p-4 max-md:hidden"
      >
        <InlineBit kind="envelope" />
        <div class="min-w-0 flex-1">
          <p class="text-meta font-semibold">
            {{ $t('contests.announcements.alert.title') }} · {{ streamed.contest.value.name }}
          </p>
          <p class="mt-0.5 line-clamp-2 text-sm">{{ shown.title }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <AppButton size="sm" tone="primary" :to="announcementsTab">
              {{ $t('contests.announcements.alert.view') }}
            </AppButton>
            <AppButton size="sm" tone="ghost" @click="close(shown.id)">
              {{ $t('contests.announcements.alert.close') }}
            </AppButton>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>
