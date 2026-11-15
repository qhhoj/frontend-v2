<script setup lang="ts">
import { ChevronLeft, Search } from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import type { CurrentParticipation } from '@/api/types/contests';
import AppButton from '@/components/ui/AppButton.vue';
import BrandWordmark from '@/components/ui/BrandWordmark.vue';
import IconButton from '@/components/ui/IconButton.vue';
import NotificationBell from '@/features/notifications/NotificationBell.vue';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useIsFirstNavigationPending } from '@/router/first-navigation';
import { pageBack } from '@/components/ui/page-back';
import { useSessionStore } from '@/stores/session.store';
import TopBarLiveContest from './TopBarLiveContest.vue';
import { useCurrentSection } from './nav-items';

/**
 * The phone's bar over the page (56 px, below `md`): back to the section (hidden when the page header shows a back link), the section's name (the brand on the home page; the page's own name is its H1),
 * search, and the bell or sign-in. A desktop has no top bar: its crumb is in each page's header and the bell, language and
 * look are at the rail's foot. The notification announcements are `NotificationAnnouncer`'s.
 */
/** `liveContest`: the contest the viewer is in, to show as a chip; null on that contest's own pages (its bar shows it). */
defineProps<{ liveContest: CurrentParticipation | null }>();
const emit = defineEmits<{ search: [] }>();
const { t } = useI18n();
const route = useRoute();
const session = useSessionStore();
const isPhone = useMediaQuery(PHONE_QUERY);
/** Until the session answers the bar offers neither sign-in nor the bell. */
const isSessionPending = useIsFirstNavigationPending();
const section = useCurrentSection();

const sectionLabel = computed(() => (section.value ? t(section.value.labelKey) : null));
const isAtSectionRoot = computed(() => section.value?.path === route.path);
/** The arrow goes to the section root; the page header's own back link, when it shows one, is more specific and wins. */
const backTo = computed(() =>
  section.value && !isAtSectionRoot.value && !pageBack.value ? section.value.path : null,
);
const isHome = computed(() => route.path === '/');
</script>

<template>
  <header v-if="isPhone" class="border-b border-line bg-surface-solid print:hidden">
    <!-- `data-page-column`: the loading Bits keep to the gutters beside this column (`pageColumn`). -->
    <div data-page-column class="flex h-14 items-center gap-1 px-2">
      <IconButton v-if="backTo" :to="backTo" :label="$t('nav.back')">
        <ChevronLeft aria-hidden="true" class="size-5" />
      </IconButton>
      <BrandWordmark v-if="isHome" size="sm" class="px-2" />
      <span v-else class="min-w-0 flex-1 truncate px-1 text-subtitle leading-6 font-semibold">{{
        sectionLabel ?? $t('app.name')
      }}</span>
      <div class="ml-auto flex shrink-0 items-center gap-1">
        <TopBarLiveContest v-if="liveContest" :current="liveContest" />
        <IconButton
          data-testid="top-bar-search"
          :label="$t('search.title')"
          @click="emit('search')"
        >
          <Search aria-hidden="true" class="size-5" />
        </IconButton>
        <NotificationBell />
        <AppButton
          v-if="!session.user && !isSessionPending"
          :to="{ name: 'login', query: { redirect: route.fullPath } }"
        >
          {{ $t('account.login') }}
        </AppButton>
      </div>
    </div>
  </header>
</template>
