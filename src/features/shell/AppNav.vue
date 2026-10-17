<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useRoute } from 'vue-router';
import { translate } from '@/i18n';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import NavOverflowMenu from './NavOverflowMenu.vue';
import { navSectionOverride } from './nav-section';
import { NAV_ITEM_CLASS, scrollToClearFade, splitNavItems } from './nav-overflow';

/**
 * The main navigation. From `md` up the bar never wraps: the items that do not fit move into a
 * "More" menu. On a phone it is a strip that scrolls inside itself, with fades where items are clipped.
 */
const route = useRoute();
const NAV_ITEMS = [
  { path: '/', labelKey: 'nav.home' },
  { path: '/problems', labelKey: 'nav.problems' },
  { path: '/contests', labelKey: 'nav.contests' },
  { path: '/submissions', labelKey: 'nav.submissions' },
  { path: '/users', labelKey: 'nav.users' },
  { path: '/blog', labelKey: 'nav.blog' },
  { path: '/organizations', labelKey: 'nav.organizations' },
] as const;
/** A section stays current on its sub-pages (`/problems/aplusb` is in Problems), unless the page claims another (`useNavSection`). */
const isCurrent = (path: string) => {
  if (navSectionOverride.value !== null) return path === navSectionOverride.value;
  return path === '/'
    ? route.path === '/'
    : route.path === path || route.path.startsWith(`${path}/`);
};
const itemClass = (path: string) => [
  NAV_ITEM_CLASS,
  isCurrent(path)
    ? 'relative font-bold text-accent-text after:absolute after:inset-x-3 after:bottom-1.5 after:h-0.5 after:rounded-pill after:bg-accent sm:after:inset-x-4'
    : 'text-muted hover:text-content',
];

const isPhone = useMediaQuery(PHONE_QUERY);
const wrapper = useTemplateRef<HTMLElement>('wrapper');
const navElement = useTemplateRef<HTMLElement>('navElement');
const track = useTemplateRef<HTMLElement>('track');
const measurer = useTemplateRef<HTMLElement>('measurer');
const measureRow = useTemplateRef<HTMLElement>('measureRow');

// --- bar mode (md and up): which items fit ---
const itemWidths = ref<number[]>([]);
const moreWidth = ref(0);
const gap = ref(0);
const available = ref(Infinity);
const activeIndex = computed(() => NAV_ITEMS.findIndex((item) => isCurrent(item.path)));
const split = computed(() =>
  isPhone.value || itemWidths.value.length === 0
    ? { visible: NAV_ITEMS.map((_item, index) => index), hidden: [] }
    : splitNavItems({
        widths: itemWidths.value,
        available: available.value,
        moreWidth: moreWidth.value,
        gap: gap.value,
        activeIndex: activeIndex.value,
      }),
);
const visibleItems = computed(() => split.value.visible.map((index) => NAV_ITEMS[index]!));
const hiddenItems = computed(() => split.value.hidden.map((index) => NAV_ITEMS[index]!));
const menuItems = computed(() =>
  hiddenItems.value.map((item) => ({ path: item.path, label: translate(item.labelKey) })),
);

const horizontalPadding = (element: HTMLElement) => {
  const style = getComputedStyle(element);
  return parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
};
const measureBar = () => {
  const box = measurer.value;
  const wrap = wrapper.value;
  const pill = navElement.value;
  // No layout (not rendered, or a test DOM): keep every item in the bar.
  if (!box || !wrap || !pill || wrap.clientWidth === 0) return;
  const items = Array.from(box.querySelectorAll<HTMLElement>('[data-measure="item"]'));
  const more = box.querySelector<HTMLElement>('[data-measure="more"]');
  itemWidths.value = items.map((item) => item.getBoundingClientRect().width);
  moreWidth.value = more?.getBoundingClientRect().width ?? 0;
  gap.value = parseFloat(getComputedStyle(items[0]!.parentElement!).columnGap) || 0;
  available.value = wrap.clientWidth - horizontalPadding(pill);
};

// --- phone mode: the strip scrolls and fades where items are clipped ---
const startClipped = ref(false);
const endClipped = ref(false);
const FADE_PX = 24;
const fadeMask = computed(() => {
  if (!isPhone.value) return undefined;
  const start = startClipped.value ? `transparent 0, black ${FADE_PX}px` : 'black 0';
  const end = endClipped.value ? `black calc(100% - ${FADE_PX}px), transparent 100%` : 'black 100%';
  return `linear-gradient(to right, ${start}, ${end})`;
});
const readClipping = () => {
  const element = navElement.value;
  if (!element) return;
  const hiddenWidth = element.scrollWidth - element.clientWidth;
  startClipped.value = isPhone.value && element.scrollLeft > 0;
  endClipped.value = isPhone.value && element.scrollLeft < hiddenWidth - 1;
};
/** Scrolls the strip just far enough for the item to sit clear of the fades; the page itself does not move. */
const revealItem = (pill: HTMLElement, item: HTMLElement) => {
  const left =
    item.getBoundingClientRect().left - pill.getBoundingClientRect().left + pill.scrollLeft;
  pill.scrollLeft = scrollToClearFade({
    left,
    right: left + item.offsetWidth,
    scrollLeft: pill.scrollLeft,
    viewWidth: pill.clientWidth,
    fadeWidth: FADE_PX,
  });
};
/** Brings the current section's item into the strip, so the item of the page being viewed is never out of reach. */
const showCurrentItem = () => {
  const pill = navElement.value;
  const item = pill?.querySelector<HTMLElement>('[aria-current="page"]');
  if (pill && isPhone.value && item) revealItem(pill, item);
};
const onFocusIn = (event: FocusEvent) => {
  const pill = navElement.value;
  if (pill && isPhone.value && event.target instanceof HTMLElement) revealItem(pill, event.target);
};

const refresh = () => {
  measureBar();
  showCurrentItem();
  readClipping();
};

/** Locale switches, sign-in, fonts loading and scrollbars change widths without a window resize. */
let observer: ResizeObserver | undefined;
onMounted(() => {
  refresh();
  if (typeof ResizeObserver === 'undefined') return;
  observer = new ResizeObserver(refresh);
  for (const element of [wrapper.value, track.value, measureRow.value])
    if (element) observer.observe(element);
});
onBeforeUnmount(() => observer?.disconnect());
/** The route can settle after the header mounts, so the current item is brought in again on each path change. */
watch(() => route.path, refresh, { flush: 'post' });
watch(isPhone, refresh, { flush: 'post' });
</script>

<template>
  <div ref="wrapper" class="relative order-last w-full md:order-none md:min-w-0 md:flex-1">
    <nav
      ref="navElement"
      :aria-label="$t('nav.main')"
      class="glass flex w-full gap-0.5 overflow-x-auto rounded-pill p-1 md:w-fit md:max-w-full md:overflow-hidden"
      :style="{ maskImage: fadeMask, WebkitMaskImage: fadeMask }"
      @scroll="readClipping"
      @focusin="onFocusIn"
    >
      <div ref="track" class="flex w-max gap-0.5">
        <RouterLink
          v-for="item in visibleItems"
          :key="item.path"
          :to="item.path"
          :aria-current="isCurrent(item.path) ? 'page' : undefined"
          :class="itemClass(item.path)"
        >
          {{ $t(item.labelKey) }}
        </RouterLink>
        <NavOverflowMenu v-if="hiddenItems.length > 0" :items="menuItems" />
      </div>
    </nav>
    <!-- Not shown: the full-size items, measured to decide which of them fit the bar. -->
    <div
      ref="measurer"
      aria-hidden="true"
      inert
      class="pointer-events-none invisible absolute top-0 left-0 hidden h-0 w-0 overflow-hidden md:block"
    >
      <div ref="measureRow" class="flex w-max gap-0.5">
        <span
          v-for="item in NAV_ITEMS"
          :key="item.path"
          data-measure="item"
          :class="itemClass(item.path)"
        >
          {{ $t(item.labelKey) }}
        </span>
        <span data-measure="more" :class="[NAV_ITEM_CLASS, 'gap-1']">
          {{ $t('nav.more') }}
          <span class="size-4" />
        </span>
      </div>
    </div>
  </div>
</template>
