<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import UserContent from '@/components/UserContent.vue';
import { errorMessageKey } from '@/i18n/error-message';
import { useDebouncedPreview } from '@/lib/use-debounced-preview';
import Tabs from './Tabs.vue';
import TextArea from './TextArea.vue';

/**
 * The one Markdown box: Viết / Xem trước tabs, a textarea as tall as its text (never scrolls inside), a live preview through
 * `preview` (the caller's sanitising render call), the character count and an optional cap. `split` shows both panes side by side
 * from 1024 px (long statements); below that, and without `split`, one pane shows at a time. `#toolbar` sits above the textarea.
 */
const text = defineModel<string>({ required: true });
const props = withDefaults(
  defineProps<{
    /** The textarea's accessible name. */
    label: string;
    /** The textarea's id, when a page links to it (an error summary); generated when left out. */
    inputId?: string;
    /** Renders Markdown to sanitised HTML; a failure is shown under the preview and the last preview is kept. */
    preview: (markdown: string) => Promise<string>;
    /** Anything else the rendering depends on (a problem style): a change renders the preview again. */
    previewKey?: unknown;
    hint?: string;
    error?: string;
    maxLength?: number;
    /** Least visible rows; the box grows with its text. */
    rows?: number;
    split?: boolean;
    /** Words for a failed preview; defaults to the site's error text. */
    failureText?: (error: unknown) => string;
  }>(),
  {
    inputId: undefined,
    previewKey: undefined,
    hint: undefined,
    error: undefined,
    maxLength: undefined,
    rows: 6,
    split: false,
    failureText: undefined,
  },
);
defineOptions({ name: 'UiMarkdownEditor' });

const generatedId = useId();
const id = props.inputId ?? generatedId;
const { t } = useI18n();
const tab = ref<'write' | 'preview'>('write');
const rendered = useDebouncedPreview(
  () => text.value,
  (markdown) => props.preview(markdown),
  {
    // A hidden preview pane sends nothing (a one-pane editor on its Write tab); the split view shows both from `lg`.
    isActive: () => props.split || tab.value === 'preview',
    alsoWatch: [() => props.previewKey],
  },
);
const tabItems = computed(() =>
  (['write', 'preview'] as const).map((key) => ({
    key,
    label: t(`common.markdown.${key}`),
    panelId: `${id}-${key}`,
  })),
);
const failureLine = computed(() => {
  const failure = rendered.failure.value;
  if (!failure) return '';
  return props.failureText ? props.failureText(failure) : t(errorMessageKey(failure));
});
const describedBy = computed(() =>
  props.error ? `${id}-error` : props.hint ? `${id}-hint` : undefined,
);
const writeClass = computed(() => [
  tab.value === 'write' ? 'flex' : 'hidden',
  props.split && 'lg:flex',
]);
const previewClass = computed(() => [
  tab.value === 'preview' ? 'flex' : 'hidden',
  props.split && 'lg:flex',
]);

const area = ref<{ $el: HTMLTextAreaElement } | null>(null);
const textarea = computed(() => area.value?.$el ?? null);

/** Not measurable while the pane is hidden (height 0): then the CSS rows apply. */
function grow() {
  const box = textarea.value;
  if (!box) return;
  box.style.height = 'auto';
  if (box.scrollHeight === 0) {
    box.style.height = '';
    return;
  }
  box.style.height = `${box.scrollHeight + box.offsetHeight - box.clientHeight}px`;
}
watch([text, tab], () => nextTick(grow));
/** An error summary's link needs the text on screen before it can take the focus. */
defineExpose({ showWrite: () => (tab.value = 'write') });
/** A width change (resize, or the pane becoming visible) re-wraps the text, so the height is measured again. */
let width = 0;
const observer = new ResizeObserver(([entry]) => {
  if (!entry || entry.contentRect.width === width) return;
  width = entry.contentRect.width;
  grow();
});
onMounted(() => {
  grow();
  if (textarea.value) observer.observe(textarea.value);
});
onBeforeUnmount(() => observer.disconnect());
</script>

<template>
  <div class="flex flex-col gap-2">
    <Tabs
      v-model="tab"
      :items="tabItems"
      :label="$t('common.markdown.tabs')"
      variant="underline"
      :class="split && 'lg:hidden'"
    />
    <div class="flex flex-col gap-4" :class="split && 'lg:grid lg:grid-cols-2'">
      <div
        :id="`${id}-write`"
        role="tabpanel"
        :aria-labelledby="`${id}-write-tab`"
        class="min-w-0 flex-col gap-1.5"
        :class="writeClass"
      >
        <slot name="toolbar" />
        <TextArea
          :id="id"
          ref="area"
          v-model="text"
          :rows="rows"
          :maxlength="maxLength"
          :aria-label="label"
          class="resize-none overflow-hidden font-mono"
          :aria-invalid="error ? 'true' : undefined"
          :aria-describedby="describedBy"
        />
        <p v-if="error" :id="`${id}-error`" role="alert" class="text-sm text-negative">
          {{ error }}
        </p>
        <div class="flex justify-between gap-3 text-caption leading-4 text-muted">
          <span :id="`${id}-hint`">{{ hint ?? $t('common.markdown.supported') }}</span>
          <span>{{
            maxLength === undefined
              ? $t('common.markdown.count', { count: text.length })
              : $t('common.markdown.countOf', { count: text.length, max: maxLength })
          }}</span>
        </div>
      </div>
      <div
        :id="`${id}-preview`"
        role="tabpanel"
        :aria-labelledby="`${id}-preview-tab`"
        class="min-w-0 flex-col gap-1.5"
        :class="previewClass"
      >
        <div class="min-h-40 rounded-row border border-line bg-surface-strong p-4">
          <UserContent :html="rendered.html.value" />
        </div>
        <p v-if="rendered.isRateLimited.value" class="text-caption leading-4 text-negative">
          {{ $t('common.markdown.rateLimited') }}
          <template v-if="rendered.retryAfterSeconds.value">
            {{ $t('common.markdown.retryIn', { seconds: rendered.retryAfterSeconds.value }) }}
          </template>
        </p>
        <p v-if="failureLine" class="text-sm text-negative">{{ failureLine }}</p>
        <p class="text-caption leading-4 text-muted">{{ $t('common.markdown.previewHint') }}</p>
      </div>
    </div>
  </div>
</template>
