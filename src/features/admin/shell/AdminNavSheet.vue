<script setup lang="ts">
import { House, X } from 'lucide-vue-next';
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import LocaleToggle from '@/features/shell/LocaleToggle.vue';
import AdminNav from './AdminNav.vue';
import type { AdminNavId } from './admin-nav';
import type { NavCount } from './overview/admin-overview.queries';

/**
 * The phone and tablet nav: a full-height sheet over the page. A native modal <dialog> gives the focus trap, the inert
 * page behind and Escape; focus goes back to the element that opened it.
 */
defineProps<{ counts: Partial<Record<AdminNavId, NavCount>> }>();
const open = defineModel<boolean>('open', { required: true });

const sheet = ref<HTMLDialogElement | null>(null);
const titleId = useId();
let opener: HTMLElement | null = null;

watch(open, async (isOpen) => {
  const dialog = sheet.value;
  if (!dialog) return;
  if (isOpen && !dialog.open) {
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    await nextTick();
    dialog
      .querySelector<HTMLElement>('[aria-current="page"]')
      ?.scrollIntoView({ block: 'nearest' });
  } else if (!isOpen && dialog.open) {
    dialog.close();
  }
});

/** Escape, the close button and a chosen link all end here. */
function onClose() {
  open.value = false;
  opener?.focus();
  opener = null;
}
onBeforeUnmount(() => {
  if (sheet.value?.open) sheet.value.close();
});
</script>

<template>
  <dialog
    ref="sheet"
    data-testid="admin-nav-sheet"
    :aria-labelledby="titleId"
    class="m-0 h-dvh max-h-none w-full max-w-none bg-surface-solid p-0 text-content lg:hidden"
    @close="onClose"
  >
    <div class="flex h-full flex-col">
      <div class="flex min-h-14 items-center justify-between gap-2 border-b border-line px-4">
        <h2 :id="titleId" class="font-display text-lg font-semibold">
          {{ $t('admin.shell.navLabel') }}
        </h2>
        <div class="flex items-center gap-2">
          <LocaleToggle />
          <button
            type="button"
            :aria-label="$t('admin.shell.navClose')"
            class="flex size-11 items-center justify-center rounded-cell text-muted hover:bg-surface-hover hover:text-content"
            @click="open = false"
          >
            <X aria-hidden="true" class="size-5" />
          </button>
        </div>
      </div>
      <AdminNav
        :counts="counts"
        data-testid="admin-nav-phone"
        class="flex-1 overflow-y-auto overscroll-contain px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
      />
      <RouterLink
        to="/"
        data-testid="admin-back-to-site"
        class="flex min-h-11 items-center gap-2 border-t border-line px-4 text-sm font-semibold text-accent-text"
      >
        <House aria-hidden="true" class="size-4" />{{ $t('admin.shell.backToSite') }}
      </RouterLink>
    </div>
  </dialog>
</template>
