<script setup lang="ts">
import { ChevronLeft, Ellipsis } from 'lucide-vue-next';
import { useSlots } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import AppButton from './AppButton.vue';
import Menu from './Menu.vue';
import type { MenuEntry } from './Menu.vue';

export interface PageCrumb {
  label: string;
  to?: RouteLocationRaw;
  /** A code or a slug, set in mono. */
  mono?: boolean;
}

/**
 * A page's header and the only place an H1 is written: breadcrumb (from `md`), the one H1 at the page step (`page-title`,
 * 26 px, for every page, admin included), a 13 px meta line, an optional one-line lead, the actions and the page's tabs
 * under it all. The actions sit on the title's row from `md` (whatever the lead or meta under it) and below the title on
 * a phone; `overflow` adds a "⋯ Thêm" menu left of them for a third action or more (destructive items last), so the
 * primary stays the right-most button.
 * `crumbs` is the trail; below `md` it gives way to `back` (the phone's way up). A `back` without crumbs shows at every
 * width. `meta` strings are joined by "·"; the `#meta` slot adds chips or a status to the same line. `#start` is the
 * page's Bit, logo or avatar: always left of the title, on the phone too (a page Bit never goes in `#actions`).
 * `#above` is a kicker line over the title (a code, chips, a summary) and `#lead` a lead that holds more than a string.
 */
const props = withDefaults(
  defineProps<{
    title: string;
    lead?: string;
    crumbs?: PageCrumb[];
    back?: { to: RouteLocationRaw; label: string; ariaLabel?: string } | null;
    meta?: string[];
    overflow?: MenuEntry[];
  }>(),
  { lead: undefined, crumbs: () => [], back: null, meta: () => [], overflow: () => [] },
);
defineSlots<{
  start?: () => unknown;
  above?: () => unknown;
  meta?: () => unknown;
  lead?: () => unknown;
  actions?: () => unknown;
  tabs?: () => unknown;
}>();
const slots = useSlots();
const hasActions = () => Boolean(slots.actions) || props.overflow.length > 0;

/**
 * Rows: trail, kicker, title, meta + lead, actions (phone only), tabs. Columns: `#start`, the text, and from `md` the
 * actions, top-aligned with the title and spanning the meta row so a tall action never pushes the lead down. Empty rows
 * and an empty start column take no space (no grid gaps; spacing is margins).
 */
const CELL = {
  start: 'col-start-1 row-start-2 row-end-5 mr-3 self-center',
  actions:
    'col-span-full row-start-5 mt-3 flex flex-wrap items-center gap-2 md:col-span-1 md:col-start-3 md:row-start-3 md:row-end-5 md:mt-0 md:ml-4 md:self-start md:justify-end',
};
</script>

<template>
  <header
    class="grid grid-cols-[auto_minmax(0,1fr)] md:grid-cols-[auto_minmax(min(100%,16rem),1fr)_minmax(0,auto)]"
  >
    <nav
      v-if="crumbs.length > 0"
      :aria-label="$t('common.breadcrumb')"
      class="col-span-full row-start-1 hidden flex-wrap items-center gap-1.5 text-meta text-muted md:flex"
    >
      <template v-for="(crumb, index) in crumbs" :key="index">
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
      :class="crumbs.length > 0 && 'md:hidden'"
    >
      <ChevronLeft aria-hidden="true" class="size-4" />{{ back.label }}
    </RouterLink>
    <div v-if="slots.start" :class="CELL.start"><slot name="start" /></div>
    <div v-if="slots.above" class="col-start-2 row-start-2 mb-1 min-w-0">
      <slot name="above" />
    </div>
    <h1 class="col-start-2 row-start-3 min-w-0 page-title [overflow-wrap:anywhere]">
      {{ title }}
    </h1>
    <div
      v-if="meta.length > 0 || slots.meta || slots.lead || lead"
      class="col-start-2 row-start-4 min-w-0"
    >
      <div
        v-if="meta.length > 0 || slots.meta"
        class="mt-1 flex flex-wrap items-center gap-2 text-meta text-muted"
      >
        <template v-for="(item, index) in meta" :key="index">
          <span v-if="index > 0" aria-hidden="true">·</span>
          <span>{{ item }}</span>
        </template>
        <slot name="meta" />
      </div>
      <div v-if="slots.lead" class="mt-0.5 text-sm text-muted"><slot name="lead" /></div>
      <p v-else-if="lead" class="mt-0.5 text-sm text-muted">{{ lead }}</p>
    </div>
    <div v-if="hasActions()" data-testid="page-header-actions" :class="CELL.actions">
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
