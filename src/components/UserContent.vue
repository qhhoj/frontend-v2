<script setup lang="ts">
/* eslint-disable vue/no-v-html -- backend-sanitized HTML, see the doc comment below */
/**
 * The only way to show user-authored HTML (posts, comments, about texts, ticket messages).
 * `html` must already be sanitized by the backend; the `user-content` class (styles.css) confines
 * whatever it contains, so no markup can paint, size or stack outside this box.
 */
defineProps<{ html: string }>();
</script>

<template>
  <div class="user-content" v-html="html" />
</template>
