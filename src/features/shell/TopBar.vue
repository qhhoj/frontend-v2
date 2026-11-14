<script setup lang="ts">
import { ChevronLeft, ChevronRight, Search } from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import AppButton from '@/components/ui/AppButton.vue';
import BrandWordmark from '@/components/ui/BrandWordmark.vue';
import IconButton from '@/components/ui/IconButton.vue';
import AppearancePanel from '@/features/appearance/AppearancePanel.vue';
import NotificationBell from '@/features/notifications/NotificationBell.vue';
import { useNotificationAlerts } from '@/features/notifications/use-notification-alerts';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useIsFirstNavigationPending } from '@/router/first-navigation';
import { pageTitle } from '@/router/page-title';
import { useSessionStore } from '@/stores/session.store';
import LocaleToggle from './LocaleToggle.vue';
import { useCurrentSection } from './nav-items';

/**
 * The bar over the page. On a desktop (48 px): the crumbs (the section, then the page's own name; never an h1, which is
 * `PageHeader`'s), the page's actions (`#top-bar-actions`, a Teleport target), the bell, the language and the look.
 * On a phone (56 px): back to the section, the page's name (the brand on the home page), search, and the bell or sign-in.
 * It owns the notification stream's announcements in both layouts.
 */
const emit = defineEmits<{ search: [] }>();
const { t } = useI18n();
const route = useRoute();
const session = useSessionStore();
const isPhone = useMediaQuery(PHONE_QUERY);
/** Until the session answers the bar offers neither sign-in nor the bell. */
const isSessionPending = useIsFirstNavigationPending();
const alerts = useNotificationAlerts();
const section = useCurrentSection();

const sectionLabel = computed(() => (section.value ? t(section.value.labelKey) : null));
const isAtSectionRoot = computed(() => section.value?.path === route.path);
/** The page's own name, when it says more than its section's. */
const pageName = computed(() => {
  const name = pageTitle.value ?? (route.meta.titleKey ? t(route.meta.titleKey) : null);
  return name && name !== sectionLabel.value ? name : null;
});
const backTo = computed(() =>
  section.value && !isAtSectionRoot.value ? section.value.path : null,
);
const isHome = computed(() => route.path === '/');
</script>

<template>
  <header class="border-b border-line bg-surface-solid print:hidden">
    <!-- `data-page-column`: the loading Bits keep to the gutters beside this column (`pageColumn`). -->
    <div v-if="isPhone" data-page-column class="flex h-14 items-center gap-1 px-2">
      <IconButton v-if="backTo" :to="backTo" :label="$t('nav.back')">
        <ChevronLeft aria-hidden="true" class="size-5" />
      </IconButton>
      <BrandWordmark v-if="isHome" size="sm" class="px-2" />
      <span v-else class="min-w-0 flex-1 truncate px-1 text-subtitle leading-6 font-semibold">{{
        pageName ?? sectionLabel ?? $t('app.name')
      }}</span>
      <div class="ml-auto flex shrink-0 items-center gap-1">
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
    <div v-else data-page-column class="page-gutter flex h-12 items-center gap-3">
      <nav :aria-label="$t('nav.breadcrumb')" class="min-w-0 flex-1">
        <ol class="m-0 flex list-none items-center gap-1.5 p-0 text-sm">
          <li v-if="section" class="flex shrink-0 items-center">
            <RouterLink
              v-if="!isAtSectionRoot"
              :to="section.path"
              class="inline-flex min-h-11 items-center text-muted hover:text-content"
              >{{ sectionLabel }}</RouterLink
            >
            <span v-else aria-current="page" class="font-semibold text-content">{{
              sectionLabel
            }}</span>
          </li>
          <li v-if="pageName" class="flex min-w-0 items-center gap-1.5">
            <ChevronRight v-if="section" aria-hidden="true" class="size-4 shrink-0 text-muted" />
            <span aria-current="page" class="truncate font-semibold text-content">{{
              pageName
            }}</span>
          </li>
        </ol>
      </nav>
      <div id="top-bar-actions" class="flex shrink-0 items-center gap-2" />
      <div class="flex shrink-0 items-center gap-1">
        <NotificationBell />
        <LocaleToggle />
        <AppearancePanel />
      </div>
    </div>
    <p class="sr-only" aria-live="polite" data-testid="notification-arrived">
      {{ alerts.arrivedText.value }}
    </p>
  </header>
</template>
