<script setup lang="ts">
import { Ellipsis } from 'lucide-vue-next';
import Menu from 'primevue/menu';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RouteLocationRaw } from 'vue-router';
import { RouterLink, useRouter } from 'vue-router';
import { useTabsOverflow } from './TabsOverflow';

export interface TabItem {
  key: string;
  label: string;
  /** A link tab: the section lives in the URL. Without `to` on every item the tabs are an in-page tablist. */
  to?: RouteLocationRaw;
  /** Lights a link tab on a page that is not its own route; otherwise the router marks the exact match. */
  isCurrent?: boolean;
  /** A count chip after the label; hidden while null or absent. */
  count?: number | string | null;
  /** Spoken instead of the bare count ("3 yêu cầu chờ duyệt"). */
  countLabel?: string;
  /** `neutral` is a count; `accent` says something waits for the viewer. */
  countTone?: 'neutral' | 'accent';
  countTestid?: string;
  /** A red dot after the label, read as this text: the section holds something to fix. */
  alertLabel?: string;
  testid?: string;
  /** Tablist mode: the id of the panel this tab shows (`aria-controls`); the tab's own id is `<panelId>-tab`. */
  panelId?: string;
}

/**
 * A row of tabs. `pill` is the public look; `underline` switches an admin page's sections. Link tabs mark the open one
 * `aria-current="page"` (the `v-model` key, else the router's exact match); without links the row is a tablist with a
 * roving tabindex and arrow keys. `overflow="menu"` fades the clipped edges and lists hidden tabs behind a "⋯" button.
 */
const props = withDefaults(
  defineProps<{
    items: TabItem[];
    label: string;
    variant?: 'pill' | 'underline';
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
const router = useRouter();
const { t } = useI18n();

const isTablist = computed(() => props.items.every((item) => !item.to));
/** The tablist's selected tab: the model, else the first, so the row is always reachable by Tab. */
const selectedKey = computed(() => current.value ?? props.items[0]?.key);
const scroller = ref<HTMLElement | null>(null);
const { hiddenKeys, hasMoreLeft, hasMoreRight, measure } = useTabsOverflow(
  scroller,
  props.overflow === 'menu',
  [current, () => props.items.length],
);

function linkCurrent(item: TabItem) {
  if (current.value !== undefined)
    return { 'aria-current': item.key === current.value ? 'page' : undefined };
  return item.isCurrent ? { 'aria-current': 'page' } : {};
}

const STEPS: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

function targetIndex(key: string, index: number, count: number): number | null {
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  const step = STEPS[key];
  return step === undefined ? null : (index + step + count) % count;
}

function onTabKeydown(event: KeyboardEvent, index: number) {
  const target = targetIndex(event.key, index, props.items.length);
  const item = target === null ? undefined : props.items[target];
  if (target === null || !item) return;
  event.preventDefault();
  current.value = item.key;
  scroller.value?.querySelectorAll<HTMLElement>('[role="tab"]')[target]?.focus();
}

const moreMenu = ref<InstanceType<typeof Menu> | null>(null);
const moreItems = computed(() =>
  props.items
    .filter((item) => hiddenKeys.value.includes(item.key))
    .map((item) => ({
      label: item.label + (item.count == null ? '' : ` (${item.count})`),
      command: () => (item.to ? void router.push(item.to) : (current.value = item.key)),
    })),
);

const FRAME = {
  pill: 'flex',
  underline: 'relative flex items-end border-b border-line',
};
const SCROLLER = {
  pill: '-m-1 overflow-x-auto p-1',
  underline: 'overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
};
/** One active look for every tab set: accent-soft fill, accent border. */
const TAB = {
  pill: 'min-h-11 rounded-pill border border-transparent px-4 font-medium hover:bg-surface-hover aria-[current=page]:font-semibold aria-selected:font-semibold',
  underline:
    '-mb-px min-h-(--qh-control-sm) rounded-t-cell border-b-2 border-transparent px-3 font-semibold focus-visible:-outline-offset-2',
};
const TAB_BASE =
  'inline-flex items-center gap-2 text-sm whitespace-nowrap text-muted hover:text-content aria-[current=page]:border-accent aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent-soft-text aria-selected:border-accent aria-selected:bg-accent-soft aria-selected:text-accent-soft-text';
const COUNT = {
  pill: 'inline-flex min-w-5 items-center justify-center rounded-pill px-1.5 text-tiny font-semibold tabular-nums',
  underline: 'rounded-pill px-2 font-mono text-xs tabular-nums',
};
const COUNT_TONE = {
  pill: { neutral: 'bg-surface-hover text-content', accent: 'bg-accent text-on-accent' },
  underline: { neutral: 'bg-surface-strong text-muted', accent: 'bg-accent text-on-accent' },
};
const ALERT = 'size-2 shrink-0 rounded-full bg-negative';
</script>

<template>
  <component
    :is="isTablist ? 'div' : 'nav'"
    :aria-label="isTablist ? undefined : label"
    :class="[FRAME[variant], sticky && 'sticky top-0 z-20 bg-ground']"
  >
    <div class="relative min-w-0 flex-1">
      <!-- The pill strip's padding and negative margin leave room for the focus ring that the scroll frame would clip. -->
      <div ref="scroller" :class="SCROLLER[variant]" @scroll.passive="measure">
        <ul
          class="flex min-w-max gap-1"
          :role="isTablist ? 'tablist' : undefined"
          :aria-label="isTablist ? label : undefined"
        >
          <li
            v-for="(item, index) in items"
            :key="item.key"
            class="flex"
            :role="isTablist ? 'presentation' : undefined"
          >
            <component
              :is="item.to ? RouterLink : 'button'"
              v-bind="
                item.to
                  ? { to: item.to, ...linkCurrent(item) }
                  : {
                      type: 'button',
                      role: 'tab',
                      id: item.panelId && `${item.panelId}-tab`,
                      'aria-controls': item.panelId,
                      'aria-selected': item.key === selectedKey,
                      tabindex: item.key === selectedKey ? 0 : -1,
                    }
              "
              :data-tab-key="item.key"
              :data-testid="item.testid"
              :class="[TAB_BASE, TAB[variant]]"
              @click="item.to ? undefined : (current = item.key)"
              @keydown="item.to ? undefined : onTabKeydown($event, index)"
            >
              {{ item.label }}
              <span
                v-if="item.count != null"
                :class="[COUNT[variant], COUNT_TONE[variant][item.countTone ?? 'neutral']]"
              >
                <span
                  :data-testid="item.countTestid"
                  :aria-hidden="item.countLabel ? 'true' : undefined"
                  >{{ item.count }}</span
                >
                <span v-if="item.countLabel" class="sr-only">{{ item.countLabel }}</span>
              </span>
              <span v-if="item.alertLabel" :class="ALERT">
                <span class="sr-only">{{ item.alertLabel }}</span>
              </span>
            </component>
          </li>
        </ul>
      </div>
      <span
        v-if="hasMoreLeft"
        aria-hidden="true"
        class="pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-ground to-transparent"
      />
      <span
        v-if="hasMoreRight"
        aria-hidden="true"
        class="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-ground to-transparent"
      />
    </div>
    <template v-if="moreItems.length > 0">
      <button
        type="button"
        :data-testid="moreTestid"
        aria-haspopup="menu"
        :aria-label="moreLabel ?? t('nav.more')"
        class="mb-1 ml-1 flex size-(--qh-control-sm) shrink-0 items-center justify-center rounded-cell text-muted hover:bg-surface-hover hover:text-content"
        @click="moreMenu?.toggle($event)"
      >
        <Ellipsis aria-hidden="true" class="size-4" />
      </button>
      <Menu ref="moreMenu" :model="moreItems" popup />
    </template>
  </component>
</template>
