<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import type { EditorHandle } from './code-editor-cm';
import { loadLanguagePack } from './code-languages';
import { useLowPowerPainted } from '@/lib/use-low-power-painted';
import { indentAt, outdentLineAt, writeEdit } from './tab-indent';

const props = withDefaults(
  defineProps<{
    label: string;
    disabled?: boolean;
    minLines?: number;
    /** The language's editor mode key (`Language.ace`); `null` or one without a pack is plain text. */
    language?: string | null;
  }>(),
  {
    disabled: false,
    minLines: 12,
    language: null,
  },
);
const source = defineModel<string>({ required: true });

const host = ref<HTMLElement>();
const textarea = ref<HTMLTextAreaElement>();
const isEditorReady = ref(false);
let editor: EditorHandle | undefined;
let isUnmounted = false;
// Language packs arrive asynchronously; only the answer to the latest request may be applied.
let languageRequestCount = 0;
// setDoc fires the editor's change listener; without this guard an external value would be echoed back.
let isApplyingExternalValue = false;
/** Low-power keeps the plain textarea (no CodeMirror chunk); there Tab indents, and Escape then Tab leaves (no keyboard trap). */
const isLowPower = useLowPowerPainted();
const hintId = useId();
let isTabReleased = false;
const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta']);

// Same count as CodeMirror's gutter (its width follows the widest number), so the swap keeps the column width.
const lineCount = computed(() => source.value.split('\n').length);
const lineNumbers = computed(() =>
  Array.from({ length: lineCount.value }, (_unused, index) => index + 1),
);

/** Where the user's caret is in the textarea, if they are in it, so the editor can take over without losing their place. */
function readTextareaFocus() {
  const field = textarea.value;
  if (!field || document.activeElement !== field) return undefined;
  const isBackward = field.selectionDirection === 'backward';
  const { selectionStart, selectionEnd } = field;
  return isBackward
    ? { anchor: selectionEnd, head: selectionStart }
    : { anchor: selectionStart, head: selectionEnd };
}

async function importEditorModule() {
  try {
    return await import('./code-editor-cm');
  } catch (error) {
    // A chunk that fails to load keeps the textarea: same label, same v-model, no data loss.
    console.warn('code editor failed to load', error);
    return undefined;
  }
}

async function applyLanguage() {
  const thisRequest = ++languageRequestCount;
  const pack = props.language ? await loadLanguagePack(props.language) : null;
  if (thisRequest === languageRequestCount && !isUnmounted) editor?.setLanguage(pack);
}

async function loadEditor() {
  const editorModule = await importEditorModule();
  if (!editorModule || isUnmounted || isLowPower.value) return;
  const selection = readTextareaFocus();
  // Create the editor only once its host is visible, so CodeMirror measures real sizes.
  isEditorReady.value = true;
  await nextTick();
  if (isUnmounted || !host.value) return;
  try {
    editor = editorModule.createEditor(host.value, {
      doc: source.value,
      label: props.label,
      disabled: props.disabled,
      selection,
      onChange: (doc) => {
        if (!isApplyingExternalValue) source.value = doc;
      },
    });
  } catch (error) {
    // Bring the textarea back with the current text rather than leave an empty box.
    console.warn('code editor failed to load', error);
    isEditorReady.value = false;
    return;
  }
  if (selection) editor.focus();
  await applyLanguage();
}

watch(source, (value) => {
  isApplyingExternalValue = true;
  try {
    editor?.setDoc(value);
  } finally {
    isApplyingExternalValue = false;
  }
});
watch(
  () => props.disabled,
  (disabled) => editor?.setDisabled(disabled),
);

watch(() => props.language, applyLanguage);

function unloadEditor() {
  editor?.destroy();
  editor = undefined;
  isEditorReady.value = false;
}

function onTextareaKeydown(event: KeyboardEvent) {
  if (!isLowPower.value) return;
  if (MODIFIER_KEYS.has(event.key)) return; // Escape, then Shift, then Shift+Tab must still leave (WCAG 2.1.2)
  const isPlainTab = event.key === 'Tab' && !event.altKey && !event.ctrlKey && !event.metaKey;
  if (!isPlainTab || isTabReleased) {
    isTabReleased = event.key === 'Escape';
    return;
  }
  event.preventDefault();
  const field = event.target as HTMLTextAreaElement;
  const edit = {
    text: field.value,
    selectionStart: field.selectionStart,
    selectionEnd: field.selectionEnd,
  };
  const next = event.shiftKey ? outdentLineAt(edit) : indentAt(edit);
  writeEdit(field, next);
  source.value = field.value;
}

onMounted(() => {
  if (!isLowPower.value) void loadEditor();
});
/** Low-power switched with the editor open: the textarea takes over (the text lives in v-model), or the editor comes back. */
watch(isLowPower, (isOn) => (isOn ? unloadEditor() : void loadEditor()));
onBeforeUnmount(() => {
  isUnmounted = true;
  editor?.destroy();
});
</script>

<template>
  <div
    class="code-editor rounded-cell border border-line-control bg-surface-strong"
    :style="{ '--min-lines': minLines }"
  >
    <div v-show="isEditorReady" ref="host" class="code-editor-host"></div>
    <div v-if="!isEditorReady" class="code-editor-fallback">
      <div aria-hidden="true" class="code-editor-gutter">
        <span v-for="lineNumber in lineNumbers" :key="lineNumber">{{ lineNumber }}</span>
      </div>
      <textarea
        ref="textarea"
        v-model="source"
        :aria-label="label"
        :disabled="disabled"
        :rows="Math.max(minLines, lineCount)"
        wrap="off"
        spellcheck="false"
        autocapitalize="off"
        :aria-describedby="isLowPower ? hintId : undefined"
        class="code-editor-textarea"
        @keydown="onTextareaKeydown"
        @blur="isTabReleased = false"
      ></textarea>
    </div>
    <p
      v-if="isLowPower && !isEditorReady"
      :id="hintId"
      data-testid="editor-tab-hint"
      class="border-t border-line px-3 py-2 font-body text-xs text-muted"
    >
      {{ $t('lowPower.editorHint') }}
    </p>
  </div>
</template>
