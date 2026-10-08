<script setup lang="ts">
import UserContent from '@/components/UserContent.vue';
import { formatDateTime } from '@/lib/format';
import type { Announcement } from '@/api/types/contests';
import { useLocaleStore } from '@/stores/locale.store';

defineProps<{ announcement: Announcement; isUnread: boolean; isCompact?: boolean }>();
const locale = useLocaleStore();
</script>

<template>
  <article
    data-testid="announcement"
    class="flex flex-col gap-1.5 border-t border-line py-3.5 first:border-t-0"
  >
    <p class="flex items-center gap-2 text-[12.5px] text-muted">
      <time :datetime="announcement.createdAt">{{
        formatDateTime(announcement.createdAt, locale.locale)
      }}</time>
      <span
        v-if="isUnread"
        data-testid="unread-pill"
        class="rounded-pill bg-accent-soft px-2 font-semibold text-accent-soft-text"
        >{{ $t('contests.announcements.new') }}</span
      >
    </p>
    <h3 class="font-semibold">{{ announcement.title }}</h3>
    <div :class="{ 'line-clamp-3': isCompact }">
      <UserContent :html="announcement.descriptionHtml" />
    </div>
  </article>
</template>
