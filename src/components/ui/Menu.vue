<!-- eslint-disable vue/multi-word-component-names -- the kit names primitives by role (docs/design-language.md). -->
<script setup lang="ts">
import type { Component } from 'vue';
import { computed, ref, useId, useTemplateRef, watch } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { useRouter } from 'vue-router';
import { yieldsToComposition } from './keys';
import { usePopup } from './popup';

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
  /** Starts a new group: a separator above it (sign-out under the account pages). */
  separated?: boolean;
}

/**
 * A popup list of actions (`popup.ts`: top layer, beside its opener), destructive ones last and separated. The `trigger` slot
 * draws the opener and gets `toggle`, `open` (aria-expanded) and `setOpener` (a template ref callback naming the element the
 * list sits beside, when it is not the clicked one). `label` names the list. An item with `to` is a real link (`href`: open
 * in a new tab, copy the address). Keys (WAI-ARIA menu): the arrows, Home and End move, Enter and Space pick, Escape closes
 * back to the opener, Tab closes and moves on. Opened from the keyboard, the first item is active. Focus returns to the
 * opener before an item runs, so a confirm dialog the item opens returns focus there. A row's "⋯" button is `RowMenu`.
 */
const props = defineProps<{ items: MenuEntry[]; label: string }>();
const router = useRouter();
const listId = useId();
const panel = useTemplateRef<HTMLElement>('panel');
const popup = usePopup(panel, () => popup.close());
let slotOpener: HTMLElement | null = null;
/** The active item's index in `entries`, -1 for none. */
const active = ref(-1);

/** Plain items, then the destructive ones; `separated` marks the first item of each group after the first. */
const entries = computed(() => {
  const plain = props.items.filter((item) => !item.danger);
  const danger = props.items
    .filter((item) => item.danger)
    .map((item, index) => (index === 0 && plain.length ? { ...item, separated: true } : item));
  return [...plain, ...danger].map((item, index) => ({
    ...item,
    separated: index > 0 && item.separated,
  }));
});
const enabledIndexes = computed(() =>
  entries.value.flatMap((item, index) => (item.disabled ? [] : [index])),
);
const itemId = (index: number) => `${listId}-${index}`;
const hrefOf = (item: MenuEntry) => (item.to ? router.resolve(item.to).href : undefined);

function setOpener(element: HTMLElement | null) {
  slotOpener = element;
}
/** A keyboard click (`detail` 0) opens on the first item. */
function toggle(event: Event) {
  if (popup.isOpen.value) return popup.close();
  active.value = (event as MouseEvent).detail === 0 ? (enabledIndexes.value[0] ?? -1) : -1;
  popup.open(slotOpener ?? (event.currentTarget as HTMLElement | null));
}
watch(panel, (element) => element?.focus({ preventScroll: true }), { flush: 'post' });

function closeToOpener() {
  popup.close();
  popup.opener.value?.focus();
}
function runItem(item: MenuEntry) {
  closeToOpener();
  if (item.to) void router.push(item.to);
  else item.run?.();
}
/** A ctrl, cmd or shift click on a link item is the browser's (a new tab or window); the menu does not also navigate. */
const isModified = (event: MouseEvent) => event.ctrlKey || event.metaKey || event.shiftKey;
function onClick(item: MenuEntry, event: MouseEvent) {
  if (item.disabled) return event.preventDefault();
  if (item.to && isModified(event)) return popup.close();
  event.preventDefault();
  runItem(item);
}

function step(by: 1 | -1) {
  const enabled = enabledIndexes.value;
  const at = enabled.indexOf(active.value);
  const first = by === 1 ? 0 : enabled.length - 1;
  active.value = enabled[at < 0 ? first : (at + by + enabled.length) % enabled.length] ?? -1;
}
function pickActive() {
  const item = entries.value[active.value];
  if (item && !item.disabled) runItem(item);
}
const KEYS: Record<string, () => void> = {
  ArrowDown: () => step(1),
  ArrowUp: () => step(-1),
  Home: () => (active.value = enabledIndexes.value[0] ?? -1),
  End: () => (active.value = enabledIndexes.value.at(-1) ?? -1),
  Enter: pickActive,
  ' ': pickActive,
  Escape: closeToOpener,
};
/** Escape is taken here (`preventDefault`), so a dialog the menu sits in stays open. Tab moves on from the opener. */
function onKeydown(event: KeyboardEvent) {
  if (yieldsToComposition(event)) return;
  if (event.key === 'Tab') return closeToOpener();
  const action = KEYS[event.key];
  if (!action) return;
  event.preventDefault();
  action();
}
</script>

<template>
  <slot name="trigger" :toggle="toggle" :open="popup.isOpen.value" :set-opener="setOpener" />
  <Teleport v-if="popup.isOpen.value" :to="popup.host.value">
    <ul
      :id="listId"
      ref="panel"
      popover="manual"
      data-popup
      role="menu"
      tabindex="-1"
      :aria-label="label"
      :aria-activedescendant="active >= 0 ? itemId(active) : undefined"
      class="m-0 min-w-52 list-none rounded-row border border-line-strong bg-surface-solid p-1 text-content shadow-float outline-none"
      @keydown="onKeydown"
    >
      <template v-for="(item, index) in entries" :key="index">
        <li v-if="item.separated" role="separator" class="my-1 border-t border-line" />
        <li
          :id="itemId(index)"
          role="menuitem"
          :aria-disabled="item.disabled || undefined"
          class="rounded-cell"
          :class="[
            !item.disabled && 'hover:bg-surface-hover',
            active === index && 'bg-surface-hover outline-2 -outline-offset-2 outline-focus',
          ]"
        >
          <a
            :href="hrefOf(item)"
            tabindex="-1"
            class="flex min-h-10 items-center gap-3 px-3 text-sm no-underline touch:min-h-11"
            :class="
              item.disabled
                ? 'cursor-not-allowed text-muted'
                : ['cursor-pointer', item.danger ? 'text-negative' : 'text-content']
            "
            @click="onClick(item, $event)"
          >
            <component
              :is="item.icon"
              v-if="item.icon"
              aria-hidden="true"
              class="size-4 shrink-0"
              :class="item.danger ? 'text-negative' : 'text-muted'"
              :stroke-width="1.75"
            />
            <span class="flex flex-col" :class="item.hint && 'py-1.5'">
              <span>{{ item.label }}</span>
              <span v-if="item.hint" class="text-caption leading-4 text-muted">{{
                item.hint
              }}</span>
            </span>
          </a>
        </li>
      </template>
    </ul>
  </Teleport>
</template>
