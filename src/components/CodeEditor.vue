<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
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
const isEditorReady = ref(false);
let editor: EditorHandle | undefined;
let isUnmounted = false;
// setDoc fires the editor's change listener; without this guard an external value would be echoed back.
let isApplyingExternalValue = false;

const lineNumbers = computed(() =>
  Array.from(
    { length: Math.max(props.minLines, source.value.split('\n').length) },
    (_unused, index) => index + 1,
  ),
);

// A chunk that fails to load keeps the textarea: same label, same v-model, no data loss.
async function loadEditor() {
  try {
    const { createEditor } = await import('./code-editor-cm');
    if (isUnmounted || !host.value) return;
    editor = createEditor(host.value, {
      doc: source.value,
      label: props.label,
      disabled: props.disabled,
      onChange: (doc) => {
        if (!isApplyingExternalValue) source.value = doc;
      },
    });
    isEditorReady.value = true;
  } catch {
    editor = undefined;
  }
}

watch(source, (value) => {
  isApplyingExternalValue = true;
  editor?.setDoc(value);
  isApplyingExternalValue = false;
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
        v-model="source"
        :aria-label="label"
        :disabled="disabled"
        :rows="lineNumbers.length"
        wrap="off"
        spellcheck="false"
        autocapitalize="off"
        class="code-editor-textarea"
      ></textarea>
    </div>
  </div>
</template>
