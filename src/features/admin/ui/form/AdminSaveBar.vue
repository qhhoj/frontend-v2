<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { buttonClass } from '../controls';
import { SITE_TIME_ZONE } from './site-time';

/**
 * The one save bar of an admin form: sticky to the bottom of the content column, above the page (z-30).
 * Left: "3 thay đổi chưa lưu", "Đã lưu lúc 14:02" or why saving is not possible, in a polite live region.
 * Right: optional extra actions, "Huỷ thay đổi" (emits `discard`) and the submit button.
 * The submit button is `type="submit"`: put the bar inside the `<form>`, or pass the form's id as `form`.
 * While there is nothing to save (no change, `pending`, or a `blockedReason`) both buttons are `aria-disabled`, keep focus,
 * and a click does nothing. `allowClean` (create forms) lets a form with no change be saved and hides the discard button.
 * The page's `scroll-padding-bottom` follows the bar's height, so a focused field is never hidden under it.
 */
const props = withDefaults(
  defineProps<{
    dirtyCount: number;
    pending?: boolean;
    savedAt?: Date | string | null;
    allowClean?: boolean;
    blockedReason?: string;
    saveLabel?: string;
    form?: string;
  }>(),
  {
    pending: false,
    savedAt: null,
    allowClean: false,
    blockedReason: undefined,
    saveLabel: undefined,
    form: undefined,
  },
);
const emit = defineEmits<{ discard: [] }>();
const { t } = useI18n();

const isDirty = computed(() => props.dirtyCount > 0);
const cannotSave = computed(
  () => props.pending || !!props.blockedReason || (!props.allowClean && !isDirty.value),
);
const cannotDiscard = computed(() => props.pending || !isDirty.value);

const savedTime = computed(() =>
  props.savedAt
    ? new Intl.DateTimeFormat('vi-VN', {
        timeZone: SITE_TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(new Date(props.savedAt))
    : null,
);
const statusText = computed(() => {
  if (props.blockedReason) return props.blockedReason;
  if (isDirty.value) return t('admin.form.saveBar.unsaved', props.dirtyCount);
  if (savedTime.value) return t('admin.form.saveBar.savedAt', { time: savedTime.value });
  return props.allowClean ? '' : t('admin.form.saveBar.clean');
});

function guardSave(event: MouseEvent) {
  if (cannotSave.value) event.preventDefault();
}
function discard() {
  if (!cannotDiscard.value) emit('discard');
}

const bar = useTemplateRef<HTMLElement>('bar');
const root = document.documentElement;
const previousPadding = root.style.scrollPaddingBottom;
let observer: ResizeObserver | undefined;
onMounted(() => {
  const follow = () =>
    (root.style.scrollPaddingBottom = `${(bar.value?.offsetHeight ?? 0) + 16}px`);
  follow();
  if (typeof ResizeObserver === 'function' && bar.value) {
    observer = new ResizeObserver(follow);
    observer.observe(bar.value);
  }
});
onBeforeUnmount(() => {
  observer?.disconnect();
  root.style.scrollPaddingBottom = previousPadding;
});
</script>

<template>
  <div
    ref="bar"
    class="sticky bottom-0 z-30 -mx-[var(--qa-gutter,1rem)] flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line bg-surface-solid px-[var(--qa-gutter,1rem)] py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
  >
    <p role="status" class="flex min-w-0 flex-1 basis-48 items-center gap-2 text-sm">
      <span v-if="isDirty" aria-hidden="true" class="size-2 shrink-0 rounded-full bg-accent" />
      <slot name="status">
        <span :class="isDirty ? 'font-semibold' : 'text-muted'">{{ statusText }}</span>
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
        {{ $t('admin.form.saveBar.discard') }}
      </button>
      <button
        type="submit"
        :form="form"
        :class="buttonClass('primary')"
        :aria-disabled="cannotSave || undefined"
        :aria-busy="pending || undefined"
        @click="guardSave"
      >
        {{
          pending ? $t('admin.form.saveBar.saving') : (saveLabel ?? $t('admin.form.saveBar.save'))
        }}
      </button>
    </div>
  </div>
</template>
