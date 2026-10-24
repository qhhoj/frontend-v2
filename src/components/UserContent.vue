<script setup lang="ts">
/* eslint-disable vue/no-v-html -- backend-sanitized HTML, see the doc comment below */
// Formulas can be in any user content (posts, comments, announcements), not only statements.
import 'katex/dist/katex.min.css';
import { onMounted, ref, watch } from 'vue';
import { highlightMarkdownBlocks } from './markdown-code-highlight';
/**
 * The only way to show user-authored HTML (posts, comments, about texts, ticket messages).
 * `html` must already be sanitized by the backend; the `user-content` class (styles.css) confines
 * whatever it contains (wide pre, tables and formulas scroll inside it). Place it as a block, a flex-1
 * item or a grid cell, never in a shrink-to-fit parent (inline-size containment would collapse it to 0).
 * It confines whatever it contains, so no markup can paint, size or stack outside this box.
 */
const props = defineProps<{ html: string }>();
const root = ref<HTMLElement | null>(null);
/** A link that opens a new tab gets no handle on this page and sends no referrer, whatever the author wrote. */
const isolateNewTabLinks = (container: HTMLElement) => {
  for (const link of container.querySelectorAll<HTMLAnchorElement>('a[target]'))
    link.relList.add('noopener', 'noreferrer');
};
/**
 * After each render (`v-html` swaps the whole subtree when `html` changes): new-tab links are isolated and
 * fenced code gets colours.
 */
const afterRender = () => {
  if (!root.value) return;
  isolateNewTabLinks(root.value);
  void highlightMarkdownBlocks(root.value);
};
onMounted(afterRender);
watch(() => props.html, afterRender, { flush: 'post' });
</script>

<template>
  <div ref="root" class="user-content" v-html="html" />
</template>
