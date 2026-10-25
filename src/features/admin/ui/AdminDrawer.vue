<script setup lang="ts">
import Drawer from 'primevue/drawer';
import { X } from 'lucide-vue-next';
import { computed, nextTick, onBeforeUnmount, useId, useSlots, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { iconButtonClass } from './controls';

/**
 * A right-hand panel for editing one object (user, judge, ticket, page): 560 px, the full screen under 768 px.
 * `role="dialog"` and `aria-modal` (PrimeVue Drawer), named by its title; focus is trapped, Escape and a scrim click close it
 * (Escape only while the drawer is the topmost modal: a confirm dialog opened over it takes the key alone),
 * and focus returns to the opener. On open, focus goes to the first `[autofocus]` element, else to the title.
 * Slots: `meta` (chips under the title), `tabs` (fixed under the header), default (the scrolling body), `footer` (fixed,
 * e.g. an `AdminSaveBar`-style row). `width` (px) overrides 560 from 768 px up.
 */
const props = withDefaults(defineProps<{ title: string; subtitle?: string; width?: number }>(), {
  subtitle: undefined,
  width: 560,
});
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ hide: [] }>();
const slots = useSlots();
const { t } = useI18n();
const titleId = useId();
const body = useTemplateRef<HTMLElement>('body');
const heading = useTemplateRef<HTMLElement>('heading');
let opener: HTMLElement | null = null;

const pt = computed(() => ({
  root: {
    class:
      'flex h-full w-full flex-col border-l border-line-strong bg-surface-solid text-content md:w-[var(--drawer-width)]',
    style: { '--drawer-width': `${props.width}px` },
    'aria-labelledby': titleId,
  },
  mask: { class: 'fixed inset-0 flex justify-end bg-ground/70' },
  transition: {
    enterFromClass: 'translate-x-6 opacity-0',
    enterActiveClass: 'transition-[transform,opacity] duration-(--qh-duration) ease-standard',
    leaveActiveClass:
      'transition-[transform,opacity] duration-[calc(var(--qh-duration)*0.7)] ease-standard',
    leaveToClass: 'translate-x-6 opacity-0',
  },
}));

/**
 * PrimeVue listens for Escape on the whole document, so it would close this drawer under a dialog opened over it. Its own
 * listener is off; this one closes only when no later modal (teleported after the drawer) is open.
 */
function isTopmostModal() {
  const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
  const self = heading.value?.closest('[role="dialog"]');
  return !!self && dialogs[dialogs.length - 1] === self;
}
function onEscape(event: KeyboardEvent) {
  if (event.code === 'Escape' && isTopmostModal()) visible.value = false;
}
function onShow() {
  document.addEventListener('keydown', onEscape);
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  void nextTick(() => {
    const field = body.value?.querySelector<HTMLElement>('[autofocus]');
    (field ?? heading.value)?.focus();
  });
}
function stopEscape() {
  document.removeEventListener('keydown', onEscape);
}
onBeforeUnmount(stopEscape);
function onAfterHide() {
  stopEscape();
  if (opener?.isConnected) opener.focus();
  opener = null;
  emit('hide');
}
</script>

<template>
  <Drawer
    v-model:visible="visible"
    position="right"
    block-scroll
    :close-on-escape="false"
    :pt="pt"
    @show="onShow"
    @after-hide="onAfterHide"
  >
    <template #container="{ closeCallback }">
      <header class="flex shrink-0 items-start gap-3 border-b border-line px-5 pt-4 pb-3">
        <div class="min-w-0 flex-1">
          <h2
            :id="titleId"
            ref="heading"
            tabindex="-1"
            class="m-0 truncate section-title focus-visible:outline-none"
          >
            {{ title }}
          </h2>
          <p v-if="subtitle" class="m-0 truncate text-sm text-muted">{{ subtitle }}</p>
          <div v-if="slots.meta" class="mt-2 flex flex-wrap items-center gap-1.5">
            <slot name="meta" />
          </div>
        </div>
        <button
          type="button"
          :class="iconButtonClass('ghost')"
          :aria-label="t('common.close')"
          :title="t('common.close')"
          @click="closeCallback"
        >
          <X aria-hidden="true" class="size-4.5" :stroke-width="1.75" />
        </button>
      </header>
      <div v-if="slots.tabs" class="shrink-0 border-b border-line px-5">
        <slot name="tabs" />
      </div>
      <div ref="body" class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
        <slot />
      </div>
      <footer
        v-if="slots.footer"
        class="flex shrink-0 flex-wrap items-center gap-2 border-t border-line px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <slot name="footer" />
      </footer>
    </template>
  </Drawer>
</template>
