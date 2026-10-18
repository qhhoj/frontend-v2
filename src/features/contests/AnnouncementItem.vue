<script setup lang="ts">
import Chip from '@/components/ui/Chip.vue';
import UserContent from '@/components/UserContent.vue';
import { formatDate } from '@/lib/format-date';
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
    <p class="flex items-center gap-2 text-caption text-muted">
      <time :datetime="announcement.createdAt">{{
        formatDate(announcement.createdAt, 'datetime', locale.locale)
      }}</time>
      <Chip v-if="isUnread" data-testid="unread-pill" tone="accent">{{
        $t('contests.announcements.new')
      }}</Chip>
    </p>
    <h3 class="font-semibold">{{ announcement.title }}</h3>
    <div :class="{ 'line-clamp-3': isCompact }">
      <UserContent :html="announcement.descriptionHtml" />
    </div>
  </article>
</template>
