<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { EditorHandle } from './code-editor-cm';

const props = withDefaults(
  defineProps<{ label: string; disabled?: boolean; minLines?: number }>(),
  {
    disabled: false,
    minLines: 12,
  },
);
const source = defineModel<string>({ required: true });

const host = ref<HTMLElement>();
const textarea = ref<HTMLTextAreaElement>();
const isEditorReady = ref(false);
let editor: EditorHandle | undefined;
let isUnmounted = false;
// setDoc fires the editor's change listener; without this guard an external value would be echoed back.
let isApplyingExternalValue = false;

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

async function loadEditor() {
  const editorModule = await importEditorModule();
  if (!editorModule || isUnmounted) return;
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

onMounted(loadEditor);
onBeforeUnmount(() => {
  isUnmounted = true;
  editor?.destroy();
});
</script>

<template>
  <div
    class="code-editor rounded-tile border border-line bg-surface-strong"
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
        class="code-editor-textarea"
      ></textarea>
    </div>
  </div>
</template>
