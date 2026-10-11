<script setup lang="ts">
/** The general tab's section list: one row of pills (sideways scroll on a phone) that brings a section into view and focuses its heading. */
defineProps<{ sections: { id: string; label: string }[]; label: string }>();

function jump(id: string) {
  const section = document.getElementById(id);
  if (!section) return;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  section.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  section.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
}
</script>

<template>
  <nav
    :aria-label="label"
    class="flex max-w-full gap-1 self-start overflow-x-auto rounded-pill border border-line-strong bg-surface-solid p-1"
  >
    <button
      v-for="section in sections"
      :key="section.id"
      type="button"
      class="inline-flex min-h-11 shrink-0 items-center rounded-pill px-4 text-sm font-semibold whitespace-nowrap text-muted hover:bg-surface-hover hover:text-content"
      @click="jump(section.id)"
    >
      {{ section.label }}
    </button>
  </nav>
</template>
