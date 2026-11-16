<script setup lang="ts">
import { ChevronLeft, Ellipsis } from 'lucide-vue-next';
import { computed, useSlots } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import AppButton from './AppButton.vue';
import Menu from './Menu.vue';
import type { MenuEntry } from './Menu.vue';
import { usePublishBack } from './page-back';
import { CUE_TEXT } from './cue-tones';
import type { CueTone } from './cue-tones';
import { useInjectedSection } from './page-section';

/** One fact of the meta line: "label value", the value in mono, a `tone` colours it with a cue (live, partial, ...). */
export interface PageFact {
  label?: string;
  value: string;
  mono?: boolean;
  tone?: CueTone;
}

export interface PageCrumb {
  label: string;
  to?: RouteLocationRaw;
  /** A code or a slug, set in mono. */
  mono?: boolean;
}

/**
 * A page's header and the only place an H1 is written: breadcrumb (from `md`), the one H1 at the page step (`page-title`,
 * 24 px, for every page, admin included), a 12 px meta line, an optional one-line lead, the actions and the page's tabs
 * under it all. The actions sit on the title's row from `md` (whatever the lead or meta under it) and below the title on
 * a phone; `overflow` adds a "⋯ Thêm" menu left of them for a third action or more (destructive items last), so the
 * primary stays the right-most button.
 * `crumbs` is the trail; below `md` it gives way to `back` (the phone's way up). A `back` without crumbs shows at every
 * width. `meta` strings are joined by "·"; the `#meta` slot adds chips or a status to the same line. `#start` is the
 * page's Bit, logo or avatar: always left of the title, on the phone too (a page Bit never goes in `#actions`).
 * A page with neither `crumbs` nor `back` shows its section as the one crumb ("Kỳ thi" over a contest's title), unless it is
 * the section's own root page, where the H1 says the same. The page's `back` is published (`page-back.ts`) so the phone top
 * bar can hide its own arrow.
 * `#titleTools` holds icon buttons at the end of the title row, at every width (a phone keeps them off the actions row).
 * `besideFrom="xl"` keeps the actions under the title until `xl`.
 * `facts` are the page's own numbers in the meta line ("Giới hạn 1 giây · Bộ nhớ 256 MB"): the label muted, the value in mono
 * unless `mono` is false, a `tone` colours the value, "·" between facts. On a phone they wrap onto their own line under `meta`. They replace
 * a hand-built `#meta` slot of boxes; `meta` and `#meta` stay.
 * `#above` is a kicker line over the title (a code, chips, a summary) and `#lead` a lead that holds more than a string.
 */
const props = withDefaults(
  defineProps<{
    title: string;
    lead?: string;
    crumbs?: PageCrumb[];
    back?: { to: RouteLocationRaw; label: string; ariaLabel?: string } | null;
    meta?: string[];
    facts?: PageFact[];
    overflow?: MenuEntry[];
    /** The width from which the actions leave their row under the title and sit beside it: `md` (default) or `xl` (a wide action group). */
    besideFrom?: 'md' | 'xl';
    /** Extra classes on the h1, for a title that carries a colour (a user's rating tier). */
    titleClass?: string;
  }>(),
  {
    lead: undefined,
    titleClass: undefined,
    crumbs: () => [],
    back: null,
    meta: () => [],
    facts: () => [],
    overflow: () => [],
    besideFrom: 'md',
  },
);
defineSlots<{
  start?: () => unknown;
  above?: () => unknown;
  meta?: () => unknown;
  lead?: () => unknown;
  actions?: () => unknown;
  titleTools?: () => unknown;
  tabs?: () => unknown;
}>();
const slots = useSlots();
const { t } = useI18n();
const route = useRoute();
const section = useInjectedSection();
usePublishBack(() => props.back);
const shownCrumbs = computed<PageCrumb[]>(() => {
  if (props.crumbs.length > 0 || props.back || !section.value) return props.crumbs;
  if (section.value.path === route.path) return [];
  return [{ label: t(section.value.labelKey), to: section.value.path }];
});
const hasActions = () => Boolean(slots.actions) || props.overflow.length > 0;

/**
 * Rows: trail, kicker, title, meta + lead, actions (phone only), tabs. Columns: `#start`, the text, and from `md` the
 * actions, top-aligned with the title and spanning the meta row so a tall action never pushes the lead down. Empty rows
 * and an empty start column take no space (no grid gaps; spacing is margins).
 */
const CELL = {
  start: 'col-start-1 row-start-2 row-end-5 mr-3 self-center',
  actions: 'col-span-full row-start-5 mt-3 flex flex-wrap items-center gap-2',
};
/** Where the actions sit once they are beside the title: the third column, top-aligned with the title. */
const BESIDE = {
  md: 'md:col-span-1 md:col-start-3 md:row-start-3 md:row-end-5 md:mt-0 md:ml-4 md:self-start md:justify-end',
  xl: 'xl:col-span-1 xl:col-start-3 xl:row-start-3 xl:row-end-5 xl:mt-0 xl:ml-4 xl:self-start xl:justify-end',
};
const GRID = {
  md: 'md:grid-cols-[auto_minmax(min(100%,16rem),1fr)_minmax(0,auto)]',
  xl: 'xl:grid-cols-[auto_minmax(min(100%,16rem),1fr)_minmax(0,auto)]',
};
</script>

<template>
  <header class="grid grid-cols-[auto_minmax(0,1fr)]" :class="GRID[besideFrom]">
    <nav
      v-if="shownCrumbs.length > 0"
      :aria-label="$t('common.breadcrumb')"
      class="col-span-full row-start-1 hidden flex-wrap items-center gap-1.5 text-caption text-muted md:flex"
    >
      <template v-for="(crumb, index) in shownCrumbs" :key="index">
        <span v-if="index > 0" aria-hidden="true">/</span>
        <RouterLink
          v-if="crumb.to"
          :to="crumb.to"
          class="hover:text-content hover:underline"
          :class="{ 'font-mono': crumb.mono }"
          >{{ crumb.label }}</RouterLink
        >
        <span v-else :class="{ 'font-mono': crumb.mono }">{{ crumb.label }}</span>
      </template>
    </nav>
    <RouterLink
      v-if="back"
      :to="back.to"
      :aria-label="back.ariaLabel"
      class="col-span-full row-start-1 -ml-1 inline-flex min-h-11 items-center gap-1 justify-self-start text-sm font-semibold text-accent-text"
      :class="shownCrumbs.length > 0 && 'md:hidden'"
    >
      <ChevronLeft aria-hidden="true" class="size-4" />{{ back.label }}
    </RouterLink>
    <div v-if="slots.start" :class="CELL.start"><slot name="start" /></div>
    <div v-if="slots.above" class="col-start-2 row-start-2 mb-1 min-w-0">
      <slot name="above" />
    </div>
    <!-- Without `#titleTools` the wrapper takes no box (`contents`): the H1 stays the grid item. -->
    <div
      :class="
        slots.titleTools ? 'col-start-2 row-start-3 flex min-w-0 items-start gap-2' : 'contents'
      "
    >
      <h1
        class="col-start-2 row-start-3 min-w-0 page-title [overflow-wrap:anywhere]"
        :class="[titleClass, slots.titleTools && 'flex-1']"
      >
        {{ title }}
      </h1>
      <div v-if="slots.titleTools" class="-my-1 flex shrink-0 items-center gap-1">
        <slot name="titleTools" />
      </div>
    </div>
    <div
      v-if="meta.length > 0 || facts.length > 0 || slots.meta || slots.lead || lead"
      class="col-start-2 row-start-4 min-w-0"
    >
      <div
        v-if="meta.length > 0 || facts.length > 0 || slots.meta"
        class="mt-1 flex flex-wrap items-center gap-2 text-meta text-muted"
      >
        <template v-for="(item, index) in meta" :key="index">
          <span v-if="index > 0" aria-hidden="true">·</span>
          <span>{{ item }}</span>
        </template>
        <slot name="meta" />
        <template v-if="facts.length > 0">
          <span v-if="meta.length > 0" aria-hidden="true" class="max-md:hidden">·</span>
          <dl
            class="m-0 flex flex-wrap items-center gap-x-2 max-md:basis-full max-md:gap-x-3"
            data-testid="page-facts"
          >
            <template v-for="(fact, index) in facts" :key="index">
              <span v-if="index > 0" aria-hidden="true" class="max-md:hidden">·</span>
              <div class="flex items-baseline gap-1">
                <dt v-if="fact.label">{{ fact.label }}</dt>
                <dd
                  class="m-0"
                  :class="[fact.mono !== false && 'font-mono', fact.tone && CUE_TEXT[fact.tone]]"
                >
                  {{ fact.value }}
                </dd>
              </div>
            </template>
          </dl>
        </template>
      </div>
      <div v-if="slots.lead" class="mt-0.5 text-meta text-muted"><slot name="lead" /></div>
      <p v-else-if="lead" class="mt-0.5 text-meta text-muted">{{ lead }}</p>
    </div>
    <div
      v-if="hasActions()"
      data-testid="page-header-actions"
      :class="[CELL.actions, BESIDE[besideFrom]]"
    >
      <Menu v-if="overflow.length > 0" :items="overflow" :label="$t('common.moreActions')">
        <template #trigger="{ toggle, open, setOpener }">
          <AppButton
            :ref="(el) => setOpener((el as { $el?: HTMLElement } | null)?.$el ?? null)"
            aria-haspopup="menu"
            :aria-expanded="open"
            data-testid="page-header-overflow"
            @click="toggle"
          >
            <template #icon><Ellipsis aria-hidden="true" class="size-4" /></template>
            {{ $t('nav.more') }}
          </AppButton>
        </template>
      </Menu>
      <slot name="actions" />
    </div>
    <div v-if="slots.tabs" class="col-span-full row-start-6 mt-3 min-w-0 md:mt-4">
      <slot name="tabs" />
    </div>
  </header>
</template>
