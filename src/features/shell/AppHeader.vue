<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppearancePanel from '@/features/appearance/AppearancePanel.vue';
import NotificationBell from '@/features/notifications/NotificationBell.vue';
import LocaleToggle from './LocaleToggle.vue';
import UserMenu from './UserMenu.vue';

const route = useRoute();
const NAV_ITEMS = [
  { path: '/', labelKey: 'nav.home' },
  { path: '/problems', labelKey: 'nav.problems' },
  { path: '/contests', labelKey: 'nav.contests' },
  { path: '/users', labelKey: 'nav.users' },
  { path: '/blog', labelKey: 'nav.blog' },
  { path: '/organizations', labelKey: 'nav.organizations' },
] as const;
/** A section stays current on its sub-pages (`/problems/aplusb` is in Problems). */
const isCurrent = (path: string) =>
  path === '/' ? route.path === '/' : route.path === path || route.path.startsWith(`${path}/`);

/** The pill scrolls inside itself when its items do not fit; the edges fade where items are clipped. */
const navElement = useTemplateRef<HTMLElement>('navElement');
const startClipped = ref(false);
const endClipped = ref(false);
const FADE_WIDTH = '1.5rem';
const fadeMask = computed(() => {
  const start = startClipped.value ? `transparent 0, black ${FADE_WIDTH}` : 'black 0';
  const end = endClipped.value
    ? `black calc(100% - ${FADE_WIDTH}), transparent 100%`
    : 'black 100%';
  return `linear-gradient(to right, ${start}, ${end})`;
});
const readClipping = () => {
  const element = navElement.value;
  if (!element) return;
  const hiddenWidth = element.scrollWidth - element.clientWidth;
  startClipped.value = element.scrollLeft > 0;
  endClipped.value = element.scrollLeft < hiddenWidth - 1;
};
/** Scrolls the pill just far enough for the item to show whole; the page itself does not move. */
const revealItem = (pill: HTMLElement, item: HTMLElement) => {
  const itemLeft =
    item.getBoundingClientRect().left - pill.getBoundingClientRect().left + pill.scrollLeft;
  const itemRight = itemLeft + item.offsetWidth;
  if (itemRight > pill.scrollLeft + pill.clientWidth)
    pill.scrollLeft = itemRight - pill.clientWidth;
  else if (itemLeft < pill.scrollLeft) pill.scrollLeft = itemLeft;
};
/** Brings the current section's item into the pill, so the item of the page being viewed is never out of reach. */
const showCurrentItem = () => {
  const pill = navElement.value;
  const item = pill?.querySelector<HTMLElement>('[aria-current="page"]');
  if (pill && item) revealItem(pill, item);
};

/** The route can settle after the header mounts, so the current item is brought in again on each path change. */
watch(() => route.path, showCurrentItem, { flush: 'post' });
onMounted(() => {
  showCurrentItem();
  readClipping();
  window.addEventListener('resize', readClipping);
});
onBeforeUnmount(() => window.removeEventListener('resize', readClipping));
</script>

<template>
  <header class="relative flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-4 sm:px-8">
    <RouterLink
      to="/"
      class="flex min-h-11 items-center gap-2.5 font-display text-xl font-bold text-content"
    >
      <span aria-hidden="true" class="bg-gradient-accent inline-block size-[30px] rounded-full" />
      {{ $t('app.name') }}
    </RouterLink>
    <nav
      ref="navElement"
      :aria-label="$t('nav.main')"
      class="glass order-last flex w-full gap-0.5 overflow-x-auto rounded-pill p-1 md:order-none md:w-auto"
      :style="{ maskImage: fadeMask, WebkitMaskImage: fadeMask }"
      @scroll="readClipping"
    >
      <RouterLink
        v-for="item in NAV_ITEMS"
        :key="item.path"
        :to="item.path"
        :aria-current="isCurrent(item.path) ? 'page' : undefined"
        class="inline-flex min-h-11 items-center rounded-pill px-2 text-sm whitespace-nowrap sm:px-4 sm:text-base"
        :class="
          isCurrent(item.path)
            ? 'bg-surface-hover font-semibold text-content'
            : 'text-muted hover:text-content'
        "
      >
        {{ $t(item.labelKey) }}
      </RouterLink>
    </nav>
    <div class="ml-auto flex items-center gap-2">
      <LocaleToggle />
      <AppearancePanel />
      <NotificationBell />
      <UserMenu />
    </div>
  </header>
</template>
