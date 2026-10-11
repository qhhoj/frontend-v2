<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { useRoute, useRouter } from 'vue-router';
import { ANNOUNCEMENTS_PAGE_SIZE, fetchAnnouncements } from '@/api/contest-editing.api';
import type { Announcement, EditableContest } from '@/api/types/contest-editing';
import EmptyState from '@/components/EmptyState.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useViewerId } from '@/stores/use-viewer-id';
import AnnouncementComposer from './AnnouncementComposer.vue';
import AnnouncementItem from './AnnouncementItem.vue';

const props = defineProps<{ contest: EditableContest }>();
const route = useRoute();
const router = useRouter();
const viewer = useViewerId();
const page = computed(() => Math.max(1, Number(route.query.page) || 1));
const justPostedId = ref<string | null>(null);
const isPushedLive = computed(() => props.contest.settings?.pushAnnouncements ?? false);

const { data, error, isPending, refetch } = useQuery({
  queryKey: computed(() => [
    'admin',
    'contest-announcements',
    props.contest.key,
    viewer.value,
    page.value,
  ]),
  queryFn: () => fetchAnnouncements(props.contest.key, page.value),
});
const total = computed(() => data.value?.meta.total ?? 0);
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / ANNOUNCEMENTS_PAGE_SIZE)));
const items = computed<Announcement[]>(() => data.value?.items ?? []);

const goToPage = (target: number) =>
  router.push({ query: { ...route.query, page: String(target) } });

/** A delete that empties a later page sends the list back one page: an empty page never shows without its pager. */
watch(data, (answer) => {
  if (answer && answer.items.length === 0 && (answer.meta.total ?? 0) > 0 && page.value > 1) {
    void goToPage(page.value - 1);
  }
});
</script>

<template>
  <div class="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
    <AnnouncementComposer
      :contest-key="contest.key"
      :is-pushed-live="isPushedLive"
      @posted="(created) => (justPostedId = created.id)"
    />
    <section
      class="flex min-w-0 flex-col gap-3"
      :aria-label="$t('admin.contests.announcements.listLabel')"
    >
      <QueryState :loading="isPending" :error="error" @retry="refetch()">
        <template #skeleton>
          <div class="flex flex-col gap-3">
            <SkeletonBlock class="h-28 w-full" />
            <SkeletonBlock class="h-28 w-full" />
            <SkeletonBlock class="h-28 w-full" />
          </div>
        </template>
        <EmptyState v-if="items.length === 0">{{
          $t('admin.contests.announcements.empty')
        }}</EmptyState>
        <template v-else>
          <AnnouncementItem
            v-for="item in items"
            :key="item.id"
            :contest-key="contest.key"
            :announcement="item"
            :is-just-posted="item.id === justPostedId"
            :is-pushed-live="isPushedLive"
          />
          <footer class="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
            <span>{{
              $t('admin.contests.announcements.pager', { total, page, pages: pageCount })
            }}</span>
            <NumberedPager
              v-if="data && pageCount > 1"
              :meta="data.meta"
              :label="$t('admin.contests.announcements.pagerLabel')"
              compact
            />
          </footer>
        </template>
      </QueryState>
    </section>
  </div>
</template>
