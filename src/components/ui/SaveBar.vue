<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useSlots, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Check } from 'lucide-vue-next';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { SITE_TIME_ZONE, formatClock } from '@/lib/format-date';
import { useBottomScrollPadding } from '@/lib/use-bottom-scroll-padding';
import AppButton from './AppButton.vue';
import { SAVED_NOTE_MS } from './SaveBar.props';
import type { SaveBarProps } from './SaveBar.props';

/**
 * The one save bar of a form: sticky to the bottom of the content column (z-savebar).
 * Left: "3 thay đổi chưa lưu", "Đã lưu lúc 14:02" for 3 s after a save, or why saving is not possible, in a polite live region
 * (the `status` slot replaces it), then `note` (changes elsewhere on the page that the leave guard also counts), `changedParts`
 * (the parts of a page with several sections that hold the changes: "Thông tin 2 · Đề bài 1") and `immediateNote`
 * (what applies at once, without Save). "Hủy thay đổi" asks first when more than one change is pending. A page bar with nothing to say (no change, no save running,
 * no error, no note) is not rendered at any width: it slides in on the first change and keeps the focused field above itself.
 * `allowClean` forms always show it.
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
  note: undefined,
  changedParts: undefined,
  immediateNote: undefined,
  saveLabel: undefined,
  form: undefined,
  variant: 'page',
  timeZone: SITE_TIME_ZONE,
});
const emit = defineEmits<{ discard: [] }>();
const { t } = useI18n();

const isDirty = computed(() => props.dirtyCount > 0);
/** The page bar is a floating row of small buttons; a dialog footer keeps the full-height ones. */
const buttonSize = computed(() => (props.variant === 'footer' ? 'md' : 'sm'));
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
  () =>
    !isDirty.value &&
    !props.pending &&
    !savedTime.value &&
    !props.blockedReason &&
    !props.note &&
    !props.immediateNote &&
    !slots.status,
);

const statusText = computed(() => {
  if (props.blockedReason) return props.blockedReason;
  if (isDirty.value) return t('form.saveBar.unsaved', props.dirtyCount);
  if (savedTime.value) return t('form.saveBar.savedAt', { time: savedTime.value });
  return props.allowClean || props.note ? '' : t('form.saveBar.clean');
});

/** "Thông tin 2 · Đề bài 1": only the parts that hold a change. */
const changedPartsText = computed(() =>
  (props.changedParts ?? [])
    .filter((part) => part.count > 0)
    .map((part) => `${part.label} ${part.count}`)
    .join(' · '),
);

const isShown = computed(() => props.variant === 'footer' || props.allowClean || !isIdle.value);

const isDiscardAsked = ref(false);
/** One change is discarded at once; several are asked about first. */
function discard() {
  if (cannotDiscard.value) return;
  if (props.dirtyCount > 1) isDiscardAsked.value = true;
  else emit('discard');
}
function confirmDiscard() {
  isDiscardAsked.value = false;
  emit('discard');
}

/** "14:02" in `timeZone` for `SAVED_NOTE_MS` after each new `savedAt`, then null. */
function useSavedNote(savedAt: () => Date | string | null, timeZone: () => string) {
  const shown = ref<string | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  /** A zone the browser does not know (an old profile value) falls back to the site's. */
  const format = (at: Date | string) => {
    try {
      return formatClock(at, { timeZone: timeZone() });
    } catch {
      return formatClock(at, { timeZone: SITE_TIME_ZONE });
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
    keepFocusAbove();
  },
);
/** A bar that hides while focus is inside it would drop focus to the page: hand it to the form's first field instead. */
watch(
  isShown,
  (shown) => {
    if (!shown && bar.value?.contains(document.activeElement)) focusForm();
  },
  { flush: 'pre' },
);
function focusForm() {
  const form = props.form ? document.getElementById(props.form) : bar.value?.closest('form');
  const field = form?.querySelector<HTMLElement>('input:not([type=hidden]), select, textarea');
  if (field) field.focus();
  else if (form instanceof HTMLElement) {
    form.tabIndex = -1;
    form.focus();
  }
}

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
  <Transition
    enter-active-class="motion-safe:transition-transform motion-safe:duration-(--qh-duration) motion-safe:ease-standard"
    leave-active-class="motion-safe:transition-transform motion-safe:duration-(--qh-duration-fast) motion-safe:ease-exit"
    enter-from-class="motion-safe:translate-y-full"
    leave-to-class="motion-safe:translate-y-full"
  >
    <div
      v-if="isShown"
      ref="bar"
      :data-variant="variant"
      :data-save-bar="variant"
      class="flex flex-wrap items-center gap-x-3 gap-y-2"
      :class="[
        variant === 'footer'
          ? 'flex-auto'
          : 'sticky bottom-[calc(var(--tab-bar-height,0px)+max(0.75rem,var(--shell-inset-bottom,env(safe-area-inset-bottom))))] z-savebar rounded-card border border-accent bg-surface py-2 pr-2 pl-4 shadow-float',
      ]"
    >
      <p role="status" class="flex min-w-0 flex-1 basis-48 items-center gap-2 text-sm">
        <span
          v-if="isDirty || note"
          aria-hidden="true"
          class="size-2 shrink-0 rounded-full bg-accent"
        />
        <slot name="status">
          <span
            v-if="!isDirty && !blockedReason && savedTime"
            class="inline-flex items-center gap-2 font-semibold text-positive"
            ><Check class="size-4 shrink-0" aria-hidden="true" />{{ statusText }}</span
          >
          <span v-else-if="statusText" :class="isDirty ? 'font-semibold' : 'text-muted'">{{
            statusText
          }}</span>
        </slot>
        <template v-if="note">
          <span v-if="statusText || slots.status" aria-hidden="true" class="text-muted">·</span>
          <span class="font-semibold">{{ note }}</span>
        </template>
        <template v-if="changedPartsText">
          <span v-if="statusText || slots.status || note" aria-hidden="true" class="text-muted"
            >·</span
          >
          <span data-save-changed-parts class="font-semibold">{{ changedPartsText }}</span>
        </template>
        <template v-if="immediateNote">
          <span
            v-if="statusText || slots.status || note || changedPartsText"
            aria-hidden="true"
            class="text-muted"
            >·</span
          >
          <span class="text-muted">{{ immediateNote }}</span>
        </template>
      </p>
      <div class="ml-auto flex flex-wrap items-center gap-2">
        <slot name="actions" />
        <AppButton
          v-if="!allowClean"
          tone="secondary"
          :size="buttonSize"
          :disabled="cannotDiscard"
          @click="discard"
        >
          {{ $t('form.saveBar.discard') }}
        </AppButton>
        <AppButton
          tone="primary"
          :size="buttonSize"
          type="submit"
          :form="form"
          :disabled="cannotSave"
          :loading="pending"
        >
          {{ pending ? $t('form.saveBar.saving') : (saveLabel ?? $t('common.save')) }}
        </AppButton>
      </div>
      <ConfirmDialog
        v-model:visible="isDiscardAsked"
        :title="$t('form.saveBar.discardTitle', dirtyCount)"
        :body="$t('form.saveBar.discardBody')"
        :confirm-label="$t('form.saveBar.discard')"
        :cancel-label="$t('form.saveBar.keepEditing')"
        tone="danger"
        @confirm="confirmDiscard"
      />
    </div>
  </Transition>
</template>
