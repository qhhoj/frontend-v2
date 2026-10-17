<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ANNOUNCEMENT_FIRST_PAGE } from '@/api/contests.api';
import InlineBit from '@/components/InlineBit.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { useNow } from '@/lib/use-now';
import { useViewerId } from '@/stores/use-viewer-id';
import { loadSeenAnnouncement, seenAnnouncementId } from '../announcement-seen';
import { useContestAnnouncementsQuery } from '../contests.queries';
import { useAnnouncementFeed } from '../use-announcement-feed';
import { alertedAnnouncement, dismissAnnouncementAlert } from './announcement-alert';
import { useLiveContest } from './use-live-contest';

/**
 * P-16: the announcements of the contest the viewer is in reach every page. The app shell owns that contest's stream (contest
 * pages stream only other contests), says each new title in a polite live region, and shows the newest unread announcement:
 * a toast at the bottom right on a computer, a banner under the header on a phone. It goes once read (the Announcements tab
 * marks it) or closed.
 */
const live = useLiveContest();
const route = useRoute();
const viewerId = useViewerId();
const now = useNow(15_000);
const key = computed(() => live.contest.value?.key ?? '');
/** Announcements are pushed only until the contest's own end (a virtual run after it gets none). */
const isStreaming = computed(
  () => !!live.contest.value && Date.parse(live.contest.value.endTime) > now.value,
);
const { message } = useAnnouncementFeed(key, isStreaming);
const { data } = useContestAnnouncementsQuery(key, ref(ANNOUNCEMENT_FIRST_PAGE), isStreaming);
watch(
  [viewerId, key],
  ([viewer, contestKey]) => contestKey && loadSeenAnnouncement(viewer, contestKey),
  {
    immediate: true,
  },
);
const isOnAnnouncementsTab = computed(
  () => route.name === 'contest-announcements' && route.params.key === key.value,
);
const shown = computed(() =>
  isStreaming.value && !isOnAnnouncementsTab.value
    ? alertedAnnouncement(data.value?.items ?? [], seenAnnouncementId(viewerId.value, key.value))
    : null,
);
const announcementsTab = computed(() => ({
  name: 'contest-announcements',
  params: { key: key.value },
}));
</script>

<template>
  <div>
    <div data-testid="contest-announcement-live" role="status" aria-live="polite" class="sr-only">
      {{ message }}
    </div>
    <aside
      v-if="shown && live.contest.value"
      data-testid="announcement-alert"
      :aria-label="$t('contests.announcements.alert.label')"
      class="z-toast max-md:px-4 max-md:pt-3 md:fixed md:right-6 md:bottom-[calc(var(--dock-height,0px)+1.5rem)] md:w-96"
    >
      <div class="flex items-start gap-3 rounded-row border border-accent bg-surface-solid p-4">
        <InlineBit kind="envelope" />
        <div class="min-w-0 flex-1">
          <p class="text-meta font-semibold">
            {{ $t('contests.announcements.alert.title') }}
            <span class="max-md:hidden"> · {{ live.contest.value.name }}</span>
          </p>
          <p class="mt-0.5 line-clamp-2 text-sm">{{ shown.title }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <AppButton size="sm" tone="primary" :to="announcementsTab">
              {{ $t('contests.announcements.alert.view') }}
            </AppButton>
            <AppButton size="sm" tone="ghost" @click="dismissAnnouncementAlert(shown.id)">
              {{ $t('contests.announcements.alert.close') }}
            </AppButton>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>
