<script setup lang="ts">
import { CalendarDays } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppButton from './AppButton.vue';
import FormField from './FormField.vue';
import IconButton from './IconButton.vue';
import type { DateTimeFieldProps } from './DateTimeField.props';
import TextInput from './TextInput.vue';
import { reportUnreadableDate } from './date-validity';
import {
  SITE_TIME_ZONE,
  formatInZone,
  parseInZone,
  pickerTextOf,
  pickerValueOf,
  zoneLabel,
} from '@/lib/site-time';

/**
 * A date and time typed and shown in the site's time zone as `dd/mm/yyyy hh:mm`, with the zone ("GMT+7") inside the box
 * (at least 15 rem wide, so the whole text shows; the calendar button stays beside it and "Bây giờ" wraps first), a "Bây giờ" shortcut and a calendar button that opens the browser's picker (set to the site's wall clock, not the viewer's). The model is an ISO instant (UTC) or null, the value the API sends and takes.
 * With `dateOnly` the box takes `dd/mm/yyyy` alone (the model is the instant that day starts, and there is no "Bây giờ").
 * Text that does not read as a date leaves the model alone, says so when the box loses focus (or Enter is pressed), and tells
 * the form above at once (`provideDateValidity`), which refuses to save or confirm while any of its date fields is unreadable.
 */
const model = defineModel<string | null>({ required: true });
const props = withDefaults(defineProps<DateTimeFieldProps>(), {
  hint: undefined,
  error: undefined,
  inputId: undefined,
  required: false,
  timeZone: SITE_TIME_ZONE,
  showNow: undefined,
  dateOnly: false,
  disabled: false,
  scale: 'meta',
});
const { t } = useI18n();
const hasNowButton = computed(() => props.showNow ?? !props.dateOnly);
const render = (iso: string | null) =>
  formatInZone(iso, props.timeZone, props.dateOnly ? 'date' : 'datetime');
const parse = (value: string) => parseInZone(value, props.timeZone, props.dateOnly);
const text = ref(render(model.value));
/** Shown under the box after blur or Enter. */
const isUnreadable = ref(false);
/** True from the first keystroke that does not read as a date. */
const isTextUnreadable = ref(false);
/** The box says what the model says, with no error. */
function showModel() {
  text.value = render(model.value);
  clearUnreadable();
}
function clearUnreadable() {
  isUnreadable.value = false;
  isTextUnreadable.value = false;
}
reportUnreadableDate(isTextUnreadable, showModel);
const zone = computed(() =>
  zoneLabel(props.timeZone, model.value ? new Date(model.value) : new Date()),
);
const shownError = computed(
  () =>
    props.error ??
    (isUnreadable.value
      ? t(props.dateOnly ? 'admin.form.dateTime.invalidDate' : 'admin.form.dateTime.invalid')
      : undefined),
);

/** A model change from outside (load, discard) rewrites the box unless the box already says that instant. */
watch(model, (iso) => {
  const typed = parse(text.value);
  if (!typed.ok || typed.iso !== iso) text.value = render(iso);
  clearUnreadable();
});

function onInput() {
  const typed = parse(text.value);
  isTextUnreadable.value = !typed.ok;
  if (typed.ok) {
    isUnreadable.value = false;
    if (typed.iso !== model.value) model.value = typed.iso;
  }
}
function onBlur() {
  const typed = parse(text.value);
  isUnreadable.value = !typed.ok;
  isTextUnreadable.value = !typed.ok;
  if (typed.ok) text.value = render(typed.iso);
}
const picker = ref<HTMLInputElement | null>(null);
const pickerValue = computed(() => pickerValueOf(render(model.value)));
function openPicker() {
  const input = picker.value;
  if (!input) return;
  if (typeof input.showPicker === 'function') input.showPicker();
  else input.click();
}
function onPick() {
  const picked = pickerTextOf(picker.value?.value ?? '');
  if (!picked) return;
  text.value = picked;
  onInput();
  onBlur();
}
function setNow() {
  const now = new Date();
  now.setSeconds(0, 0);
  const iso = now.toISOString();
  model.value = iso;
  text.value = render(iso);
  clearUnreadable();
}
</script>

<template>
  <FormField
    :label="label"
    :hint="hint ?? $t('admin.form.dateTime.zoneHint', { zone })"
    :error="shownError"
    :input-id="inputId"
    :required="required"
    :scale="scale"
  >
    <div class="flex flex-wrap items-center gap-2">
      <div class="flex min-w-0 flex-[1_1_18rem] items-center gap-2">
        <TextInput
          v-model="text"
          class="min-w-60 flex-1 font-mono tabular-nums"
          autocomplete="off"
          spellcheck="false"
          :placeholder="
            $t(dateOnly ? 'admin.form.dateTime.placeholderDate' : 'admin.form.dateTime.placeholder')
          "
          :aria-required="required || undefined"
          :disabled="disabled"
          @input="onInput"
          @blur="onBlur"
          @keydown.enter="onBlur"
        >
          <template #suffix>
            <span aria-hidden="true" class="font-mono text-caption leading-4">{{ zone }}</span>
          </template>
        </TextInput>
        <span class="relative shrink-0">
          <IconButton
            :label="$t(dateOnly ? 'admin.form.dateTime.pickDate' : 'admin.form.dateTime.pick')"
            tone="secondary"
            :disabled="disabled"
            @click="openPicker"
          >
            <CalendarDays aria-hidden="true" />
          </IconButton>
          <!-- The browser's picker, set to the site's wall clock and read back through the same parser as the typed box. -->
          <input
            ref="picker"
            :type="dateOnly ? 'date' : 'datetime-local'"
            :value="pickerValue"
            tabindex="-1"
            aria-hidden="true"
            class="pointer-events-none absolute right-0 bottom-0 size-px opacity-0"
            @change="onPick"
          />
        </span>
      </div>
      <AppButton
        v-if="hasNowButton"
        tone="secondary"
        :aria-label="$t('admin.form.dateTime.nowLabel', { label })"
        :disabled="disabled"
        @click="setNow"
      >
        {{ $t('admin.form.dateTime.now') }}
      </AppButton>
    </div>
  </FormField>
</template>
