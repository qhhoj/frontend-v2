<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminField from '../AdminField.vue';
import { INPUT, buttonClass } from '../controls';
import { reportUnreadableDate } from './date-validity';
import { SITE_TIME_ZONE, formatInZone, parseInZone, zoneLabel } from './site-time';

/**
 * A date and time typed and shown in the site's time zone as `dd/mm/yyyy hh:mm`, with the zone ("GMT+7") inside the box
 * and a "Bây giờ" shortcut. The model is an ISO instant (UTC) or null, the value the API sends and takes.
 * With `dateOnly` the box takes `dd/mm/yyyy` alone (the model is the instant that day starts, and there is no "Bây giờ").
 * Text that does not read as a date leaves the model alone, says so when the box loses focus (or Enter is pressed), and tells
 * the form above at once (`provideDateValidity`), which refuses to save or confirm while any of its date fields is unreadable.
 */
const model = defineModel<string | null>({ required: true });
const props = withDefaults(
  defineProps<{
    label: string;
    hint?: string;
    error?: string;
    inputId?: string;
    required?: boolean;
    timeZone?: string;
    showNow?: boolean;
    dateOnly?: boolean;
    disabled?: boolean;
  }>(),
  {
    hint: undefined,
    error: undefined,
    inputId: undefined,
    required: false,
    timeZone: SITE_TIME_ZONE,
    showNow: undefined,
    dateOnly: false,
    disabled: false,
  },
);
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
  <AdminField
    v-slot="{ id, describedBy, invalid }"
    :label="label"
    :hint="hint ?? $t('admin.form.dateTime.zoneHint', { zone })"
    :error="shownError"
    :input-id="inputId"
    :required="required"
  >
    <div class="flex items-center gap-2">
      <div class="relative min-w-0 flex-1">
        <input
          :id="id"
          v-model="text"
          type="text"
          autocomplete="off"
          spellcheck="false"
          :placeholder="
            $t(dateOnly ? 'admin.form.dateTime.placeholderDate' : 'admin.form.dateTime.placeholder')
          "
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
          :aria-required="required || undefined"
          :disabled="disabled"
          :class="[INPUT, 'pr-16 font-mono tabular-nums']"
          @input="onInput"
          @blur="onBlur"
          @keydown.enter="onBlur"
        />
        <span
          aria-hidden="true"
          class="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-caption leading-4 text-muted"
        >
          {{ zone }}
        </span>
      </div>
      <button
        v-if="hasNowButton"
        type="button"
        :class="buttonClass('secondary', 'sm')"
        :aria-label="$t('admin.form.dateTime.nowLabel', { label })"
        :disabled="disabled"
        @click="setNow"
      >
        {{ $t('admin.form.dateTime.now') }}
      </button>
    </div>
  </AdminField>
</template>
