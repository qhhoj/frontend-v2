<script setup lang="ts">
import Menu from 'primevue/menu';
import type { MenuItem } from 'primevue/menuitem';
import { Ellipsis } from 'lucide-vue-next';
import type { Component } from 'vue';
import { computed, ref } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { useRouter } from 'vue-router';
import { iconButtonClass } from '../controls';

export interface RowMenuItem {
  label: string;
  icon?: Component;
  /** Runs on pick; a destructive item opens its confirm dialog here. */
  run?: () => void;
  to?: RouteLocationRaw;
  /** Destructive: listed last, in red, after a separator. The consumer must confirm before acting. */
  danger?: boolean;
  disabled?: boolean;
}

/** The "⋯" menu of a table row: secondary row actions, destructive ones last and separated. */
const props = defineProps<{ items: RowMenuItem[]; label: string }>();
const router = useRouter();
const menu = ref<InstanceType<typeof Menu>>();
const opener = ref<HTMLButtonElement>();
const isOpen = ref(false);

/**
 * Focus goes back to the ⋯ button before the item runs. A mouse pick otherwise leaves focus on the closing menu list, so a
 * confirm dialog the item opens would return focus to nothing (PrimeVue does this itself only for a keyboard pick).
 */
function runItem(item: RowMenuItem) {
  opener.value?.focus();
  if (item.to) void router.push(item.to);
  else item.run?.();
}

/** PrimeVue aligns the popup to the ⋯ button but never clamps it, so a button near or beyond the right edge (a table that scrolls sideways) pushed the menu off-screen. */
const EDGE_PX = 8;
function keepOnScreen() {
  const popup = (menu.value as unknown as { container?: HTMLElement } | undefined)?.container;
  if (!popup) return;
  const { left, right } = popup.getBoundingClientRect();
  const maxRight = document.documentElement.clientWidth - EDGE_PX;
  const shifted = Math.min(left, left - (right - maxRight));
  const clamped = Math.max(EDGE_PX, shifted);
  if (clamped !== left) popup.style.insetInlineStart = `${clamped + window.scrollX}px`;
}

function onShow() {
  keepOnScreen();
  isOpen.value = true;
}

const toMenuItem = (item: RowMenuItem): MenuItem => ({
  label: item.label,
  disabled: item.disabled,
  rowIcon: item.icon,
  danger: item.danger,
  command: () => runItem(item),
});
const model = computed<MenuItem[]>(() => {
  const plain = props.items.filter((item) => !item.danger).map(toMenuItem);
  const danger = props.items.filter((item) => item.danger).map(toMenuItem);
  return plain.length && danger.length
    ? [...plain, { separator: true }, ...danger]
    : [...plain, ...danger];
});
</script>

<template>
  <button
    ref="opener"
    type="button"
    :class="iconButtonClass('ghost', 'sm')"
    :aria-label="label"
    :title="label"
    aria-haspopup="menu"
    :aria-expanded="isOpen"
    @click="menu?.toggle($event)"
  >
    <Ellipsis aria-hidden="true" class="size-4" :stroke-width="1.75" />
  </button>
  <Menu
    ref="menu"
    :model="model"
    popup
    :pt="{ root: { 'aria-label': label } }"
    @show="onShow"
    @hide="isOpen = false"
  >
    <template #item="{ item, props: itemProps }">
      <a
        v-bind="itemProps.action"
        class="flex min-h-10 cursor-pointer items-center gap-3 px-3 text-sm no-underline pointer-coarse:min-h-11"
        :class="item.danger ? 'text-negative' : 'text-content'"
      >
        <component
          :is="item.rowIcon"
          v-if="item.rowIcon"
          aria-hidden="true"
          class="size-4 shrink-0"
          :class="item.danger ? 'text-negative' : 'text-muted'"
          :stroke-width="1.75"
        />
        <span>{{ item.label }}</span>
      </a>
    </template>
  </Menu>
</template>
