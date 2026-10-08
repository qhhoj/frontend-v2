<script setup lang="ts">
import type { RouteLocationNormalized } from 'vue-router';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import CopyButton from '@/components/CopyButton.vue';
import SettingsNotice from '../settings/SettingsNotice.vue';
import { BUTTON } from '../settings/buttons';
import { formatScratchCode, scratchCodesText } from './totp-setup';

/** The backup codes, shown once (enrolment and regeneration). Leaving before ticking the box asks first, in the shared dialog. */
const props = defineProps<{ codes: string[]; username: string; notice: string }>();
const emit = defineEmits<{ done: [] }>();
const router = useRouter();
const acknowledged = ref(false);
const reminded = ref(false);
const leaveOpen = ref(false);
const checkbox = ref<HTMLInputElement | null>(null);
const text = computed(() => scratchCodesText(props.codes, props.username));
/** The destination the viewer was heading to while the dialog asks; set only while it is open. */
let pendingLeave: RouteLocationNormalized | null = null;
/** The leave the dialog is holding was a browser Back, so Leave goes back rather than adding an entry. */
let leaveFromHistory = false;
/** A history move happened since the last leave check (set by `popstate`, read by the leave guard). */
let historyMoved = false;
let leaveApproved = false;

function download() {
  const url = URL.createObjectURL(new Blob([text.value], { type: 'text/plain' }));
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: `qhhoj-${props.username}-backup-codes.txt`,
  });
  link.click();
  // Revoked after the click has been handled: Safari and older Firefox abort a download whose URL goes in the same tick.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
/**
 * `window.print` can return before the print is rendered (iOS Safari, Chrome for Android), so the scope lasts until `afterprint`.
 * Unmounting clears it too, in case `afterprint` never fires.
 */
function print() {
  document.documentElement.dataset.printScope = 'codes';
  window.addEventListener('afterprint', clearPrintScope, { once: true });
  window.print();
}
function clearPrintScope() {
  delete document.documentElement.dataset.printScope;
  window.removeEventListener('afterprint', clearPrintScope);
}
function finish() {
  if (acknowledged.value) return emit('done');
  reminded.value = true;
  checkbox.value?.focus();
}
/** Leaving is held back until the viewer answers the dialog. Leave repeats the navigation once: a Back goes back, anything else pushes. */
function leaveAnyway() {
  leaveOpen.value = false;
  const destination = pendingLeave;
  pendingLeave = null;
  if (!destination) return;
  leaveApproved = true;
  if (leaveFromHistory) router.back();
  else void router.push(destination.fullPath);
}
const noteHistoryMove = () => void (historyMoved = true);
const keepUnsaved = (event: BeforeUnloadEvent) =>
  void (acknowledged.value || event.preventDefault());
onMounted(() => {
  window.addEventListener('beforeunload', keepUnsaved);
  window.addEventListener('popstate', noteHistoryMove);
});
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', keepUnsaved);
  window.removeEventListener('popstate', noteHistoryMove);
  clearPrintScope();
});
onBeforeRouteLeave((to) => {
  const byHistory = historyMoved;
  historyMoved = false;
  if (leaveApproved) {
    leaveApproved = false;
    return true;
  }
  if (acknowledged.value) return true;
  pendingLeave = to;
  leaveFromHistory = byHistory;
  leaveOpen.value = true;
  return false;
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <SettingsNotice tone="success" bit="crown">{{ notice }}</SettingsNotice>
    <p class="text-sm text-muted">{{ $t('settings.codes.warning') }}</p>
    <ul
      data-print-target
      :aria-label="$t('settings.codes.list')"
      class="m-0 grid list-none gap-2 p-0 sm:grid-cols-2"
    >
      <li
        v-for="code in codes"
        :key="code"
        class="rounded-cell border border-line bg-surface-strong px-3.5 py-3 font-mono text-sm font-semibold tracking-wide"
      >
        {{ formatScratchCode(code) }}
      </li>
    </ul>
    <div class="flex flex-wrap gap-2.5">
      <CopyButton :text="text" :label="$t('settings.codes.copy')" />
      <button type="button" :class="BUTTON.secondary" @click="download">
        {{ $t('settings.codes.download') }}
      </button>
      <button type="button" :class="BUTTON.secondary" @click="print">
        {{ $t('settings.codes.print') }}
      </button>
    </div>
    <label class="flex min-h-11 items-center gap-3 text-sm font-semibold">
      <input ref="checkbox" v-model="acknowledged" type="checkbox" class="size-5 accent-accent" />
      {{ $t('settings.codes.acknowledge') }}
    </label>
    <p v-if="reminded && !acknowledged" class="text-[13px] text-negative">
      {{ $t('settings.codes.acknowledgeFirst') }}
    </p>
    <button
      type="button"
      :class="[BUTTON.primary, 'self-start']"
      :aria-disabled="!acknowledged"
      @click="finish"
    >
      {{ $t('settings.codes.done') }}
    </button>
    <ConfirmDialog
      v-model:visible="leaveOpen"
      :title="$t('settings.codes.leaveTitle')"
      :body="$t('settings.codes.leaveConfirm')"
      :confirm-label="$t('settings.codes.leave')"
      :cancel-label="$t('settings.codes.stay')"
      @confirm="leaveAnyway"
    />
  </div>
</template>
