<script setup lang="ts">
import { PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next';
import type { SwitcherEntry, SwitcherStatus } from './problem-switcher';

/**
 * The contest's problems beside the statement, while the viewer's participation holds this one. The page decides when
 * it is ready (`useProblemRail`). Below `lg` the contest bar above already names the contest: the strip is the chips alone.
 */
const props = defineProps<{
  contestKey: string;
  contestName: string;
  entries: SwitcherEntry[];
  /** An ended contest opened from `?contest=`: its links carry the key so the context follows the reader. */
  carriesContest?: boolean;
  /** From `lg` up the rail is a 48 px strip: each problem shows its label and a status dot. */
  collapsed?: boolean;
}>();
defineEmits<{ toggle: [] }>();
const problemLink = (code: string) => ({
  name: 'problem',
  params: { code },
  query: props.carriesContest ? { contest: props.contestKey } : {},
});
const STATUS_CLASSES: Record<SwitcherStatus, string> = {
  solved: 'text-verdict-ac',
  tried: 'text-verdict-wa',
  untried: 'text-muted',
  unknown: 'text-muted',
};
const DOT_CLASSES: Record<SwitcherStatus, string> = {
  solved: 'bg-verdict-ac',
  tried: 'bg-verdict-wa',
  untried: 'bg-muted',
  unknown: 'bg-muted',
};
const LINK =
  'flex min-h-11 items-center gap-3 rounded-row px-3 py-2 hover:bg-surface-hover aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent-soft-text';
</script>

<template>
  <nav
    data-testid="problem-switcher"
    :aria-label="$t('problemSwitcher.title')"
    class="glass min-w-0 rounded-card p-2 lg:sticky lg:top-20"
  >
    <button
      type="button"
      data-testid="problem-switcher-toggle"
      :aria-expanded="!collapsed"
      :aria-label="$t(collapsed ? 'problemSwitcher.expand' : 'problemSwitcher.collapse')"
      :title="$t(collapsed ? 'problemSwitcher.expand' : 'problemSwitcher.collapse')"
      class="hidden min-h-11 w-full items-center rounded-row px-3 hover:bg-surface-hover lg:flex"
      :class="collapsed ? 'justify-center' : 'justify-end'"
      @click="$emit('toggle')"
    >
      <component :is="collapsed ? PanelLeftOpen : PanelLeftClose" aria-hidden="true" class="size-4" />
    </button>
    <RouterLink
      :to="{ name: 'contest', params: { key: contestKey } }"
      class="hidden min-h-11 items-center px-3 font-display text-sm font-semibold hover:text-accent-text lg:flex"
      :class="collapsed && 'lg:sr-only'"
      >{{ contestName }}</RouterLink
    >
    <ul class="m-0 flex list-none gap-1 overflow-x-auto p-0 lg:flex-col lg:overflow-visible">
      <li v-for="entry in entries" :key="entry.code" class="shrink-0">
        <RouterLink
          :to="problemLink(entry.code)"
          :aria-current="entry.isCurrent ? 'page' : undefined"
          :class="[LINK, collapsed && 'lg:justify-center lg:gap-1 lg:px-0']"
          :title="`${entry.label}. ${entry.name}`"
        >
          <span class="font-display text-subtitle leading-7 font-bold">{{ entry.label }}</span>
          <span
            aria-hidden="true"
            :class="['hidden size-2 rounded-full', DOT_CLASSES[entry.status], collapsed && 'lg:block']"
          ></span>
          <span :class="['flex min-w-0 flex-col', collapsed && 'lg:sr-only']">
            <span class="max-w-40 truncate font-semibold lg:max-w-none lg:whitespace-normal">{{
              entry.name
            }}</span>
            <span :class="['text-caption', STATUS_CLASSES[entry.status]]">{{
              $t(`problemSwitcher.status.${entry.status}`)
            }}</span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
