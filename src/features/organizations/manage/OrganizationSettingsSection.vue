<script setup lang="ts">
/** One section of the settings card: title and one short line on the left, the controls on the right; one column under 640 px. */
defineProps<{ title: string; description: string }>();
</script>

<template>
  <section class="grid gap-4 py-6 first:pt-0 last:pb-0 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-8">
    <div>
      <h3 class="font-display text-base font-bold">{{ title }}</h3>
      <p class="mt-1 text-sm text-muted">{{ description }}</p>
    </div>
    <div class="flex min-w-0 flex-col gap-4"><slot /></div>
  </section>
</template>
