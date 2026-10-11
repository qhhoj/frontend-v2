<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminField from '../AdminField.vue';
import { INPUT, buttonClass } from '../controls';
import { SITE_TIME_ZONE, formatInZone, parseInZone, zoneLabel } from './site-time';

/**
 * A date and time typed and shown in the site's time zone as `dd/mm/yyyy hh:mm`, with the zone ("GMT+7") inside the box
 * and a "Bây giờ" shortcut. The model is an ISO instant (UTC) or null, the value the API sends and takes.
 * Text that does not read as a date leaves the model alone and says so when the box loses focus.
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
    disabled?: boolean;
  }>(),
  {
    hint: undefined,
    error: undefined,
    inputId: undefined,
    required: false,
    timeZone: SITE_TIME_ZONE,
    showNow: true,
    disabled: false,
  },
);
const { t } = useI18n();
const text = ref(formatInZone(model.value, props.timeZone));
const isUnreadable = ref(false);
const zone = computed(() =>
  zoneLabel(props.timeZone, model.value ? new Date(model.value) : new Date()),
);
const shownError = computed(
  () => props.error ?? (isUnreadable.value ? t('admin.form.dateTime.invalid') : undefined),
);

/** A model change from outside (load, discard) rewrites the box unless the box already says that instant. */
watch(model, (iso) => {
  const typed = parseInZone(text.value, props.timeZone);
  if (!typed.ok || typed.iso !== iso) text.value = formatInZone(iso, props.timeZone);
  isUnreadable.value = false;
});

function onInput() {
  const typed = parseInZone(text.value, props.timeZone);
  if (typed.ok) {
    isUnreadable.value = false;
    if (typed.iso !== model.value) model.value = typed.iso;
  }
}
function onBlur() {
  const typed = parseInZone(text.value, props.timeZone);
  isUnreadable.value = !typed.ok;
  if (typed.ok) text.value = formatInZone(typed.iso, props.timeZone);
}
function setNow() {
  const now = new Date();
  now.setSeconds(0, 0);
  model.value = now.toISOString();
}
</script>

<template>
  <AdminField
    v-slot="{ id, describedBy, invalid }"
    :label="label"
    :hint="hint ?? $t('admin.form.dateTime.zoneHint', { zone: timeZone })"
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
          :placeholder="$t('admin.form.dateTime.placeholder')"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
          :aria-required="required || undefined"
          :disabled="disabled"
          :class="[INPUT, 'pr-16 font-mono tabular-nums']"
          @input="onInput"
          @blur="onBlur"
        />
        <span
          aria-hidden="true"
          class="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs text-muted"
        >
          {{ zone }}
        </span>
      </div>
      <button
        v-if="showNow"
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
