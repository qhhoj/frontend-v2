<script setup lang="ts">
import { Ellipsis } from 'lucide-vue-next';
import Menu from 'primevue/menu';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RouteLocationRaw } from 'vue-router';
import { useRoute, useRouter } from 'vue-router';

export interface AdminTab {
  key: string;
  labelKey: string;
  to: RouteLocationRaw;
  /** A count chip after the label; hidden while null or absent. */
  count?: number | null;
  /** Read instead of the bare number ("3 yêu cầu chờ duyệt"). */
  countLabel?: string;
  countTestid?: string;
  testid?: string;
}

/**
 * Underlined tabs that switch a page's sections: by route (`key` is the route name, the default `current`) or by query.
 * When they do not fit, the clipped edge fades and a "⋯" menu lists the tabs out of view; the current tab is scrolled
 * into view. `sticky` pins them to the top of the page (an editor's header).
 */
const props = defineProps<{
  tabs: AdminTab[];
  label: string;
  current?: string;
  sticky?: boolean;
}>();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const currentKey = computed(() => props.current ?? String(route.name));

const scroller = ref<HTMLElement | null>(null);
const hiddenKeys = ref<string[]>([]);
const hasMoreLeft = ref(false);
const hasMoreRight = ref(false);
/** Sub-pixel rounding leaves up to a pixel of false overflow. */
const SLACK_PX = 1;

function measure() {
  const el = scroller.value;
  if (!el) return;
  const left = el.scrollLeft;
  const right = left + el.clientWidth;
  hasMoreLeft.value = left > SLACK_PX;
  hasMoreRight.value = el.scrollWidth - right > SLACK_PX;
  hiddenKeys.value = [...el.querySelectorAll<HTMLElement>('[data-tab-key]')]
    .filter(
      (tab) =>
        tab.offsetLeft < left - SLACK_PX || tab.offsetLeft + tab.offsetWidth > right + SLACK_PX,
    )
    .map((tab) => tab.dataset.tabKey ?? '');
}

/** Brings the current tab fully into view inside the strip, never scrolling the page. */
function revealCurrent() {
  const el = scroller.value;
  const tab = el?.querySelector<HTMLElement>('[aria-current="page"]');
  if (!el || !tab) return;
  if (tab.offsetLeft < el.scrollLeft) el.scrollLeft = tab.offsetLeft;
  else if (tab.offsetLeft + tab.offsetWidth > el.scrollLeft + el.clientWidth)
    el.scrollLeft = tab.offsetLeft + tab.offsetWidth - el.clientWidth;
  measure();
}

let observer: ResizeObserver | undefined;
onMounted(() => {
  revealCurrent();
  if (typeof ResizeObserver === 'undefined' || !scroller.value) return;
  observer = new ResizeObserver(measure);
  observer.observe(scroller.value);
});
onBeforeUnmount(() => observer?.disconnect());
watch([currentKey, () => props.tabs.length], () => nextTick(revealCurrent));

const moreMenu = ref<InstanceType<typeof Menu> | null>(null);
const moreItems = computed(() =>
  props.tabs
    .filter((tab) => hiddenKeys.value.includes(tab.key))
    .map((tab) => ({
      label: t(tab.labelKey) + (tab.count == null ? '' : ` (${tab.count})`),
      command: () => void router.push(tab.to),
    })),
);
</script>

<template>
  <nav
    :aria-label="label"
    class="relative flex items-end border-b border-line"
    :class="sticky && 'sticky top-0 z-20 bg-ground'"
  >
    <div class="relative min-w-0 flex-1">
      <div
        ref="scroller"
        class="relative overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        @scroll.passive="measure"
      >
        <ul class="flex min-w-max gap-1">
          <li v-for="tab in tabs" :key="tab.key">
            <RouterLink
              :to="tab.to"
              :data-tab-key="tab.key"
              :data-testid="tab.testid"
              class="-mb-px inline-flex min-h-(--qa-control) items-center gap-2 border-b-2 border-transparent px-3 text-sm font-semibold whitespace-nowrap text-muted hover:text-content focus-visible:-outline-offset-2 aria-[current=page]:border-accent aria-[current=page]:text-content"
              :aria-current="tab.key === currentKey ? 'page' : undefined"
            >
              {{ $t(tab.labelKey) }}
              <span
                v-if="tab.count !== undefined && tab.count !== null"
                :data-testid="tab.countTestid"
                :aria-label="tab.countLabel"
                class="rounded-pill bg-surface-strong px-2 font-mono text-xs text-muted tabular-nums"
                >{{ tab.count }}</span
              >
            </RouterLink>
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
        data-testid="admin-tabs-more"
        aria-haspopup="menu"
        :aria-label="$t('admin.shell.moreTabs')"
        class="mb-1 ml-1 flex size-(--qa-control) shrink-0 items-center justify-center rounded-cell text-muted hover:bg-surface-hover hover:text-content"
        @click="moreMenu?.toggle($event)"
      >
        <Ellipsis aria-hidden="true" class="size-4" />
      </button>
      <Menu ref="moreMenu" :model="moreItems" popup />
    </template>
  </nav>
</template>
