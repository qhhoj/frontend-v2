<script setup lang="ts">
import Drawer from 'primevue/drawer';
import { X } from 'lucide-vue-next';
import { computed, nextTick, useId, useSlots, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { iconButtonClass } from './controls';

/**
 * A right-hand panel for editing one object (user, judge, ticket, page): 560 px, the full screen under 768 px.
 * `role="dialog"` and `aria-modal` (PrimeVue Drawer), named by its title; focus is trapped, Escape and a scrim click close it,
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

function onShow() {
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  void nextTick(() => {
    const field = body.value?.querySelector<HTMLElement>('[autofocus]');
    (field ?? heading.value)?.focus();
  });
}
function onAfterHide() {
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
            class="m-0 truncate font-display text-xl font-semibold focus-visible:outline-none"
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
          :aria-label="t('admin.feedback.drawer.close')"
          :title="t('admin.feedback.drawer.close')"
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
