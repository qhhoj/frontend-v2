<script setup lang="ts">
import { nextTick, watch } from 'vue';
import { OTP_LENGTH, enterDigits, eraseDigit } from '@/lib/otp';
import type { OtpEdit } from '@/lib/otp';

/** TwoFactorA's six boxes over one string: paste and autofill spread across them, digits advance, backspace walks back, no gaps. */
const props = withDefaults(defineProps<{ readonly?: boolean; label?: string }>(), {
  readonly: false,
  label: undefined,
});
const emit = defineEmits<{ complete: [code: string] }>();
const model = defineModel<string>({ required: true });
const POSITIONS = [...Array(OTP_LENGTH).keys()];
const boxes: (HTMLInputElement | null)[] = [];
const setBox = (index: number, element: unknown) =>
  void (boxes[index] = element as HTMLInputElement | null);
const focusBox = (index: number) => void nextTick(() => boxes[index]?.focus());
const firstEmptyBox = () => Math.min(model.value.length, OTP_LENGTH - 1);

function apply(edit: OtpEdit) {
  model.value = edit.code;
  focusBox(edit.focus);
}

function onInput(index: number, event: Event) {
  const input = event.target as HTMLInputElement;
  const edit =
    input.value === ''
      ? eraseDigit(model.value, index)
      : enterDigits(model.value, index, input.value);
  if (edit) apply(edit);
  else input.value = model.value[index] ?? ''; // not a digit: put the box back
}

const KEY_MOVES: Record<string, (index: number) => number> = {
  ArrowLeft: (index) => Math.max(index - 1, 0),
  ArrowRight: (index) => Math.min(index + 1, firstEmptyBox()),
};

function onKeydown(index: number, event: KeyboardEvent) {
  const move = KEY_MOVES[event.key];
  const erasesPrevious = event.key === 'Backspace' && !model.value[index];
  if (!move && !erasesPrevious) return;
  event.preventDefault();
  if (move) focusBox(move(index));
  else apply(eraseDigit(model.value, index));
}

function onPaste(index: number, event: ClipboardEvent) {
  const edit = enterDigits(model.value, index, event.clipboardData?.getData('text') ?? '');
  if (edit) apply(edit);
}

/** Boxes after the first empty one are not reachable, so the code never has a gap. */
function onFocus(index: number, event: FocusEvent) {
  if (index > firstEmptyBox()) boxes[firstEmptyBox()]?.focus();
  else (event.target as HTMLInputElement).select();
}

watch(model, (code, previous) => {
  if (code.length === OTP_LENGTH && previous.length !== OTP_LENGTH) emit('complete', code);
});
defineExpose({ focus: () => boxes[firstEmptyBox()]?.focus() });
</script>

<template>
  <div
    role="group"
    :aria-label="props.label ?? $t('auth.twoFactor.codeGroup')"
    class="grid grid-cols-6 gap-2 sm:gap-2.5"
  >
    <input
      v-for="index in POSITIONS"
      :key="index"
      :ref="(element) => setBox(index, element)"
      :value="model[index] ?? ''"
      type="text"
      inputmode="numeric"
      pattern="[0-9]*"
      :autocomplete="index === 0 ? 'one-time-code' : 'off'"
      :aria-label="$t('auth.twoFactor.digit', { index: index + 1 })"
      :readonly="props.readonly"
      class="mx-auto h-[60px] w-full max-w-[52px] min-w-0 rounded-row border border-line-strong bg-surface-solid text-center font-mono text-[26px] font-semibold text-content tabular-nums"
      @input="onInput(index, $event)"
      @keydown="onKeydown(index, $event)"
      @paste.prevent="onPaste(index, $event)"
      @focus="onFocus(index, $event)"
    />
  </div>
</template>
