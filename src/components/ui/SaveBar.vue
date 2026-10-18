<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useSlots, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Check } from 'lucide-vue-next';
import { buttonClass } from '@/features/admin/ui/controls';
import { SITE_TIME_ZONE } from '@/features/admin/ui/form/site-time';
import { useBottomScrollPadding } from '@/lib/use-bottom-scroll-padding';
import { SAVED_NOTE_MS } from './SaveBar.props';
import type { SaveBarProps } from './SaveBar.props';

/**
 * The one save bar of a form: sticky to the bottom of the content column (z-savebar).
 * Left: "3 thay đổi chưa lưu", "Đã lưu lúc 14:02" for 3 s after a save, or why saving is not possible, in a polite live region
 * (the `status` slot replaces it). `hideIdleOnPhone`: below `sm` the bar shows only while it has one of those to say, and
 * when it appears it keeps the focused field above itself.
 * Right: optional extra actions, "Hủy thay đổi" (emits `discard`) and the submit button.
 * The submit button is `type="submit"`: put the bar inside the `<form>`, or pass the form's id as `form`.
 * While there is nothing to save (no change, `pending`, or a `blockedReason`) both buttons are `aria-disabled`, keep focus,
 * and a click does nothing. `allowClean` (create forms) lets a form with no change be saved and hides the discard button.
 * The page's `scroll-padding-bottom` follows the bar's height, so a focused field is never hidden under it.
 * `variant="footer"` is for a dialog or drawer footer, which already pins, pads and rules the row: the bar drops its sticky
 * frame (and the page scroll padding) and just fills the row.
 */
const props = withDefaults(defineProps<SaveBarProps>(), {
  pending: false,
  savedAt: null,
  allowClean: false,
  blockedReason: undefined,
  saveLabel: undefined,
  form: undefined,
  variant: 'page',
  hideIdleOnPhone: false,
  timeZone: SITE_TIME_ZONE,
});
const emit = defineEmits<{ discard: [] }>();
const { t } = useI18n();

const isDirty = computed(() => props.dirtyCount > 0);
const cannotSave = computed(
  () => props.pending || !!props.blockedReason || (!props.allowClean && !isDirty.value),
);
const cannotDiscard = computed(() => props.pending || !isDirty.value);
const savedTime = useSavedNote(
  () => props.savedAt,
  () => props.timeZone,
);
const slots = useSlots();
const isIdle = computed(
  () => !isDirty.value && !savedTime.value && !props.blockedReason && !slots.status,
);

const statusText = computed(() => {
  if (props.blockedReason) return props.blockedReason;
  if (isDirty.value) return t('form.saveBar.unsaved', props.dirtyCount);
  if (savedTime.value) return t('form.saveBar.savedAt', { time: savedTime.value });
  return props.allowClean ? '' : t('form.saveBar.clean');
});

function guardSave(event: MouseEvent) {
  if (cannotSave.value) event.preventDefault();
}
function discard() {
  if (!cannotDiscard.value) emit('discard');
}

/** "14:02" in `timeZone` for `SAVED_NOTE_MS` after each new `savedAt`, then null. */
function useSavedNote(savedAt: () => Date | string | null, timeZone: () => string) {
  const shown = ref<string | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const formatIn = (at: Date | string, zone: string) =>
    new Intl.DateTimeFormat('vi-VN', {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(at));
  /** A zone the browser does not know (an old profile value) falls back to the site's. */
  const format = (at: Date | string) => {
    try {
      return formatIn(at, timeZone());
    } catch {
      return formatIn(at, SITE_TIME_ZONE);
    }
  };
  watch(
    savedAt,
    (at) => {
      clearTimeout(timer);
      shown.value = at ? format(at) : null;
      if (at) timer = setTimeout(() => (shown.value = null), SAVED_NOTE_MS);
    },
    { immediate: true },
  );
  onBeforeUnmount(() => clearTimeout(timer));
  return shown;
}

const bar = useTemplateRef<HTMLElement>('bar');
useBottomScrollPadding(
  bar,
  () => props.variant !== 'footer',
  () => {
    if (props.hideIdleOnPhone) keepFocusAbove();
  },
);
/** A bar that just appeared may sit on the field being typed into: scroll that field above it (the padding is set first). */
function keepFocusAbove() {
  const focused = document.activeElement;
  if (!(focused instanceof HTMLElement) || !bar.value || bar.value.contains(focused)) return;
  const barTop = bar.value.getBoundingClientRect().top;
  if (bar.value.offsetHeight > 0 && focused.getBoundingClientRect().bottom > barTop)
    focused.scrollIntoView({ block: 'nearest' });
}
</script>

<template>
  <div
    ref="bar"
    :data-variant="variant"
    class="flex flex-wrap items-center gap-x-3 gap-y-2"
    :class="[
      { 'max-sm:hidden': hideIdleOnPhone && isIdle },
      variant === 'footer'
        ? 'flex-auto'
        : 'sticky bottom-0 z-savebar -mx-[var(--qa-gutter,1rem)] border-t border-line bg-surface-solid px-[var(--qa-gutter,1rem)] py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
    ]"
  >
    <p role="status" class="flex min-w-0 flex-1 basis-48 items-center gap-2 text-sm">
      <span v-if="isDirty" aria-hidden="true" class="size-2 shrink-0 rounded-full bg-accent" />
      <slot name="status">
        <span
          v-if="!isDirty && !blockedReason && savedTime"
          class="inline-flex items-center gap-1.5 font-semibold text-positive"
          ><Check class="size-4 shrink-0" aria-hidden="true" />{{ statusText }}</span
        >
        <span v-else :class="isDirty ? 'font-semibold' : 'text-muted'">{{ statusText }}</span>
      </slot>
    </p>
    <div class="ml-auto flex flex-wrap items-center gap-2">
      <slot name="actions" />
      <button
        v-if="!allowClean"
        type="button"
        :class="buttonClass('ghost')"
        :aria-disabled="cannotDiscard || undefined"
        @click="discard"
      >
        {{ $t('form.saveBar.discard') }}
      </button>
      <button
        type="submit"
        :form="form"
        :class="buttonClass('primary')"
        :aria-disabled="cannotSave || undefined"
        :aria-busy="pending || undefined"
        @click="guardSave"
      >
        {{ pending ? $t('form.saveBar.saving') : (saveLabel ?? $t('form.saveBar.save')) }}
      </button>
    </div>
  </div>
</template>
