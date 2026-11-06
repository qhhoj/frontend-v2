<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useRoute } from 'vue-router';
import { translate } from '@/i18n';
import NavOverflowMenu from './NavOverflowMenu.vue';
import { NAV_ITEMS, useIsNavCurrent } from './nav-items';
import { NAV_ITEM_CLASS, splitNavItems } from './nav-overflow';

/**
 * The main navigation, from `md` up (a phone lists the sections in the menu sheet, `PhoneMenu`). The bar never wraps:
 * the items that do not fit move into a "More" menu.
 */
const route = useRoute();
const isCurrent = useIsNavCurrent();
/** The current item gets an underline in the glass bar. */
const itemClass = (path: string) => [
  NAV_ITEM_CLASS,
  isCurrent(path)
    ? 'relative font-bold text-accent-text after:absolute after:inset-x-4 after:bottom-1.5 after:h-0.5 after:rounded-pill after:bg-accent'
    : 'text-muted hover:text-content',
];

const wrapper = useTemplateRef<HTMLElement>('wrapper');
const navElement = useTemplateRef<HTMLElement>('navElement');
const track = useTemplateRef<HTMLElement>('track');
const measurer = useTemplateRef<HTMLElement>('measurer');
const measureRow = useTemplateRef<HTMLElement>('measureRow');

// Which items fit the bar.
const itemWidths = ref<number[]>([]);
const moreWidth = ref(0);
const gap = ref(0);
const available = ref(Infinity);
const activeIndex = computed(() => NAV_ITEMS.findIndex((item) => isCurrent(item.path)));
const split = computed(() =>
  itemWidths.value.length === 0
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

const refresh = measureBar;

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
/** The route can settle after the header mounts, so the bar is measured again on each path change (the current item never goes into the menu). */
watch(() => route.path, refresh, { flush: 'post' });
</script>

<template>
  <div ref="wrapper" class="relative min-w-0 flex-1">
    <nav
      ref="navElement"
      :aria-label="$t('nav.main')"
      class="glass flex w-fit max-w-full gap-0.5 overflow-hidden rounded-pill p-1"
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
      class="pointer-events-none invisible absolute top-0 left-0 h-0 w-0 overflow-hidden"
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
