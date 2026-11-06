<!-- eslint-disable vue/multi-word-component-names -- the kit names primitives by role (docs/design-language.md). -->
<script setup lang="ts">
import PrimeMenu from 'primevue/menu';
import type { MenuItem } from 'primevue/menuitem';
import type { Component } from 'vue';
import { computed, ref } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { useRouter } from 'vue-router';

export interface MenuEntry {
  label: string;
  icon?: Component;
  /** Runs on pick; a destructive item opens its confirm dialog here. */
  run?: () => void;
  to?: RouteLocationRaw;
  /** Destructive: listed last, in red, after a separator. The consumer must confirm before acting. */
  danger?: boolean;
  disabled?: boolean;
  /** A short line under the label, e.g. why a disabled item is disabled. */
  hint?: string;
}

/**
 * A popup list of actions, destructive ones last and separated. The `trigger` slot draws the opener and gets `toggle`,
 * `open` (aria-expanded) and `setOpener` (a template ref callback, so focus returns to it before an item runs).
 * `label` names the list. A row's "⋯" button is `RowMenu`, which fills the slot.
 */
const props = defineProps<{ items: MenuEntry[]; label: string }>();
const router = useRouter();
const menu = ref<InstanceType<typeof PrimeMenu>>();
let opener: HTMLElement | null = null;
const isOpen = ref(false);

/**
 * Focus goes back to the opener before the item runs. A mouse pick otherwise leaves focus on the closing menu list, so a
 * confirm dialog the item opens would return focus to nothing (PrimeVue does this itself only for a keyboard pick).
 */
function runItem(item: MenuEntry) {
  opener?.focus();
  if (item.to) void router.push(item.to);
  else item.run?.();
}

/** PrimeVue aligns the popup to the opener but never clamps it, so a button near or beyond the right edge (a table that scrolls sideways) pushed the menu off-screen. */
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

function setOpener(element: HTMLElement | null) {
  opener = element;
}
function toggle(event: Event) {
  menu.value?.toggle(event);
}

function onShow() {
  keepOnScreen();
  isOpen.value = true;
}

const toMenuItem = (item: MenuEntry): MenuItem => ({
  label: item.label,
  disabled: item.disabled,
  rowIcon: item.icon,
  danger: item.danger,
  hint: item.hint,
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
  <slot name="trigger" :toggle="toggle" :open="isOpen" :set-opener="setOpener" />
  <PrimeMenu
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
        class="flex min-h-10 cursor-pointer items-center gap-3 px-3 text-sm no-underline touch:min-h-11"
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
        <span class="flex flex-col" :class="item.hint && 'py-1.5'">
          <span>{{ item.label }}</span>
          <span v-if="item.hint" class="text-caption leading-4 text-muted">{{ item.hint }}</span>
        </span>
      </a>
    </template>
  </PrimeMenu>
</template>
