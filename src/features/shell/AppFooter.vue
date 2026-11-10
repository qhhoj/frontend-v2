<script setup lang="ts">
/** AGPL-3.0 §13: every visitor is offered the source of the running site (frontend commit; backend and judge in the same org). */
const SOURCE_URL = 'https://github.com/qhhoj';
</script>

<template>
  <footer
    data-testid="app-footer"
    class="page-gutter flex flex-wrap items-center gap-x-4 pt-2 pb-[calc(max(1.5rem,env(safe-area-inset-bottom))+var(--dock-height,0px))] text-meta text-muted"
  >
    <span>© QHHOJ</span>
    <a
      data-testid="source-link"
      :href="SOURCE_URL"
      class="inline-flex min-h-11 items-center text-accent-text underline"
      rel="noopener"
      >{{ $t('footer.source') }}</a
    >
    <RouterLink
      :to="{ name: 'runtimes' }"
      data-testid="runtimes-footer"
      class="inline-flex min-h-11 items-center text-accent-text underline"
      >{{ $t('footer.runtimes') }}</RouterLink
    >
  </footer>
</template>
