<script setup lang="ts">
/* eslint-disable vue/no-v-html -- backend-sanitized HTML, see the doc comment below */
// Formulas can be in any user content (posts, comments, announcements), not only statements.
import 'katex/dist/katex.min.css';
/**
 * The only way to show user-authored HTML (posts, comments, about texts, ticket messages).
 * `html` must already be sanitized by the backend; the `user-content` class (styles.css) confines
 * whatever it contains (wide pre, tables and formulas scroll inside it). Place it as a block, a flex-1
 * item or a grid cell, never in a shrink-to-fit parent (inline-size containment would collapse it to 0).
 * It confines whatever it contains, so no markup can paint, size or stack outside this box.
 */
defineProps<{ html: string }>();
</script>

<template>
  <div class="user-content" v-html="html" />
</template>
