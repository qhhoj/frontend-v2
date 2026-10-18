<!-- eslint-disable vue/multi-word-component-names -- the kit names primitives by role (docs/design-language.md). -->
<script setup lang="ts">
import PrimePopover from 'primevue/popover';
import { computed, ref } from 'vue';

/**
 * The one popover: PrimeVue's Popover on the shared preset, behaving like `Modal`. It opens from `toggle($event)` of its
 * opener; focus moves to its first control (else the popover itself) and Tab stays inside. Escape closes it and focus returns
 * to the opener; so does `hide()`, for a popover closed from one of its own buttons, unless the action sent focus somewhere
 * else (a link that navigates, a field it opens). An outside click closes it and leaves focus where it was clicked.
 * Name it with `label`, or `labelledby` (the id of a title inside). `show` and `hide` fire on open and close.
 */
const props = defineProps<{ label?: string; labelledby?: string }>();
const emit = defineEmits<{ show: []; hide: [] }>();

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const popover = ref<InstanceType<typeof PrimePopover>>();
const body = ref<HTMLElement>();
let opener: HTMLElement | null = null;
const pt = computed(() => ({
  root: { 'aria-label': props.label, 'aria-labelledby': props.labelledby },
}));

function toggle(event: Event) {
  opener = event.currentTarget as HTMLElement | null;
  popover.value?.toggle(event);
}

/** `preventScroll`: the popover is already beside its opener, the page must not jump to it. */
function focusFirstControl() {
  const first = body.value?.querySelector<HTMLElement>(FOCUSABLE) ?? body.value;
  first?.focus({ preventScroll: true });
}

function isFocusLost() {
  const active = document.activeElement;
  return !active || active === document.body || Boolean(body.value?.contains(active));
}

function hide() {
  const returnsFocus = isFocusLost();
  popover.value?.hide();
  if (returnsFocus && opener?.isConnected) opener.focus();
}

function onShow() {
  focusFirstControl();
  emit('show');
}

defineExpose({ toggle, hide });
</script>

<template>
  <PrimePopover ref="popover" :pt="pt" @show="onShow" @hide="emit('hide')">
    <div ref="body" tabindex="-1" class="outline-none"><slot /></div>
  </PrimePopover>
</template>
