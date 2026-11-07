<script setup lang="ts">
import { Ellipsis } from 'lucide-vue-next';
import type { Component } from 'vue';
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RouteLocationRaw } from 'vue-router';
import { RouterLink, useRoute } from 'vue-router';
import Chip from './Chip.vue';
import IconButton from './IconButton.vue';
import Menu from './Menu.vue';
import type { MenuEntry } from './Menu.vue';
import StatusMark from './StatusMark.vue';
import {
  MORE_CLASS,
  TAB_BASE,
  TAB_CLASS,
  TABS_FRAME,
  tabsList,
  tabsScroller,
} from './Tabs.classes';
import type { TabsVariant } from './Tabs.classes';
import { useTabsOverflow } from './TabsOverflow';

export interface TabItem {
  key: string;
  label: string;
  /** A link tab: the section lives in the URL. Without `to` on every item the tabs are an in-page tablist. */
  to?: RouteLocationRaw;
  /** Lights a link tab on a page that is not its own route; otherwise the router marks the exact match. */
  isCurrent?: boolean;
  /** A 16 px icon before the label (a side nav's sections). */
  icon?: Component;
  /** A count chip after the label; hidden while null or absent. */
  count?: number | string | null;
  /** Spoken instead of the bare count ("3 yêu cầu chờ duyệt"). */
  countLabel?: string;
  /** `neutral` is a count; `accent` says something waits for the viewer. */
  countTone?: 'neutral' | 'accent';
  countTestid?: string;
  /** Unsaved changes in this section: an accent dot and the count, read as "3 thay đổi chưa lưu"; hidden at 0. */
  dirty?: number;
  /** A red dot after the label, read as this text: the section holds something to fix. */
  alertLabel?: string;
  testid?: string;
  /** Tablist mode: the id of the panel this tab shows (`aria-controls`); the tab's own id is `<panelId>-tab`. */
  panelId?: string;
}

/**
 * A row of tabs. `pill` is the public look; `underline` switches an admin page's sections; `rail` is a vertical side nav
 * from `lg` and the pill row below it. Link tabs mark the open one `aria-current="page"` (the `v-model` key, else the
 * router's exact match); without links the row is a tablist with a roving tabindex and arrow keys. `overflow="menu"`
 * hides a tab that does not fit whole (never the current one) and lists it behind a "⋯" button; `scroll` lets the row
 * scroll sideways.
 */
const props = withDefaults(
  defineProps<{
    items: TabItem[];
    label: string;
    variant?: TabsVariant;
    overflow?: 'scroll' | 'menu';
    /** Pins the row to the top of the page (an editor's header). */
    sticky?: boolean;
    moreLabel?: string;
    moreTestid?: string;
  }>(),
  { variant: 'pill', overflow: 'menu', moreLabel: undefined, moreTestid: 'tabs-more' },
);
defineOptions({ name: 'UiTabs' });
const current = defineModel<string>();
const { t } = useI18n();
const route = useRoute();

const isTablist = computed(() => props.items.every((item) => !item.to));
/** The tablist's selected tab: the model, else the first, so the row is always reachable by Tab. */
const selectedKey = computed(() => current.value ?? props.items[0]?.key);
const scroller = ref<HTMLElement | null>(null);
const trigger = ref<HTMLElement | null>(null);
const hasMenu = props.overflow === 'menu';
/** A route change re-reveals the current tab too: link tabs without a model get it from the router alone. */
const { hiddenKeys, measure } = useTabsOverflow(scroller, trigger, hasMenu, [
  current,
  () => props.items.length,
  () => route.fullPath,
]);
/** A tab out of view, hidden whole; the current one is always kept in view. */
const isHidden = (item: TabItem) =>
  hiddenKeys.value.includes(item.key) && item.key !== current.value && !item.isCurrent;

function linkCurrent(item: TabItem) {
  if (current.value !== undefined)
    return { 'aria-current': item.key === current.value ? 'page' : undefined };
  return item.isCurrent ? { 'aria-current': 'page' } : {};
}

function tabAttrs(item: TabItem) {
  if (item.to) return { to: item.to, ...linkCurrent(item) };
  return {
    type: 'button',
    role: 'tab',
    id: item.panelId && `${item.panelId}-tab`,
    'aria-controls': item.panelId,
    'aria-selected': item.key === selectedKey.value,
    tabindex: item.key === selectedKey.value ? 0 : -1,
  };
}

const STEPS: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

function targetIndex(key: string, index: number, count: number): number | null {
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  const step = STEPS[key];
  return step === undefined ? null : (index + step + count) % count;
}

/** Selects the target tab, then focuses it once it is shown (a hidden tab cannot take focus). */
async function onTabKeydown(event: KeyboardEvent, index: number) {
  const target = targetIndex(event.key, index, props.items.length);
  const item = target === null ? undefined : props.items[target];
  if (target === null || !item) return;
  event.preventDefault();
  current.value = item.key;
  await nextTick();
  scroller.value?.querySelectorAll<HTMLElement>('[role="tab"]')[target]?.focus();
}

/** What a hidden tab carries besides its count: unsaved changes, else something to fix. */
function hintOf(item: TabItem): string | undefined {
  if (item.dirty) return t('form.saveBar.unsaved', item.dirty);
  return item.alertLabel;
}

const moreItems = computed<MenuEntry[]>(() =>
  props.items.filter(isHidden).map((item) => ({
    label: item.label + (item.count == null ? '' : ` (${item.count})`),
    icon: item.icon,
    hint: hintOf(item),
    ...(item.to ? { to: item.to } : { run: () => (current.value = item.key) }),
  })),
);
/** The strongest state among the hidden tabs, shown on the "⋯" button: something to fix, else unsaved edits. */
const hiddenMark = computed(() => {
  const hidden = props.items.filter(isHidden);
  if (hidden.some((item) => item.alertLabel))
    return { tone: 'danger' as const, label: t('common.hiddenAlert') };
  if (hidden.some((item) => item.dirty))
    return { tone: 'accent' as const, label: t('common.hiddenUnsaved') };
  return null;
});
const moreName = computed(() => props.moreLabel ?? t('nav.more'));
const triggerName = computed(() =>
  hiddenMark.value ? `${moreName.value}: ${hiddenMark.value.label}` : moreName.value,
);
/** The count is a small Chip; `accent` (something waits for the viewer) is the filled one. */
const COUNT_TONE = { neutral: 'neutral', accent: 'solid' } as const;
</script>

<template>
  <component
    :is="isTablist ? 'div' : 'nav'"
    :aria-label="isTablist ? undefined : label"
    :class="[TABS_FRAME[variant], sticky && 'sticky top-0 z-20 bg-ground']"
  >
    <div class="relative min-w-0 flex-1">
      <div ref="scroller" :class="tabsScroller(variant, hasMenu)" @scroll.passive="measure">
        <ul
          :class="tabsList(variant, hasMenu)"
          :role="isTablist ? 'tablist' : undefined"
          :aria-label="isTablist ? label : undefined"
        >
          <li
            v-for="(item, index) in items"
            :key="item.key"
            class="flex"
            :class="isHidden(item) && 'invisible'"
            :role="isTablist ? 'presentation' : undefined"
          >
            <component
              :is="item.to ? RouterLink : 'button'"
              v-bind="tabAttrs(item)"
              :data-tab-key="item.key"
              :data-testid="item.testid"
              :class="[TAB_BASE, TAB_CLASS[variant]]"
              @click="item.to ? undefined : (current = item.key)"
              @keydown="item.to ? undefined : onTabKeydown($event, index)"
            >
              <component
                :is="item.icon"
                v-if="item.icon"
                aria-hidden="true"
                class="size-4 shrink-0"
              />
              {{ item.label }}
              <Chip
                v-if="item.count != null"
                size="sm"
                class="font-mono tabular-nums"
                :tone="COUNT_TONE[item.countTone ?? 'neutral']"
              >
                <span
                  :data-testid="item.countTestid"
                  :aria-hidden="item.countLabel ? 'true' : undefined"
                  >{{ item.count }}</span
                >
                <span v-if="item.countLabel" class="sr-only">{{ item.countLabel }}</span>
              </Chip>
              <span
                v-if="item.dirty"
                data-testid="tab-dirty"
                class="inline-flex items-center gap-1 font-mono text-caption text-accent-text tabular-nums"
              >
                <StatusMark tone="accent" :label="t('form.saveBar.unsaved', item.dirty)" />
                <span aria-hidden="true">{{ item.dirty }}</span>
              </span>
              <StatusMark v-if="item.alertLabel" tone="danger" :label="item.alertLabel" />
            </component>
          </li>
        </ul>
      </div>
      <!-- Always laid out (hidden while nothing overflows) and over the strip, so its showing never resizes the strip. -->
      <span
        v-if="hasMenu"
        ref="trigger"
        class="inline-flex"
        :class="[MORE_CLASS[variant], moreItems.length === 0 && 'invisible']"
      >
        <Menu :items="moreItems" :label="moreName">
          <template #trigger="{ toggle, open, setOpener }">
            <IconButton
              :ref="(el) => setOpener((el as { $el?: HTMLElement } | null)?.$el ?? null)"
              :label="triggerName"
              :size="variant === 'underline' ? 'sm' : 'md'"
              :data-testid="moreTestid"
              aria-haspopup="menu"
              :aria-expanded="open"
              @click="toggle"
            >
              <Ellipsis aria-hidden="true" />
            </IconButton>
          </template>
        </Menu>
        <StatusMark
          v-if="hiddenMark"
          aria-hidden="true"
          data-testid="tabs-more-mark"
          class="pointer-events-none absolute -top-0.5 -right-0.5"
          :tone="hiddenMark.tone"
          :label="hiddenMark.label"
        />
      </span>
    </div>
  </component>
</template>
