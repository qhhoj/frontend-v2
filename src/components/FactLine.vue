<script setup lang="ts">
/**
 * A meta line of short facts ("sum · AC 92% · 100 điểm"): each fact stays whole, the line wraps only at the spaces between
 * facts, so a unit never lands alone on the next line.
 */
defineProps<{ facts: readonly string[] }>();
</script>

<template>
  <span>
    <template v-for="(fact, index) in facts" :key="index"
      ><template v-if="index > 0">{{ ' ' }}</template
      ><span class="whitespace-nowrap"
        >{{ fact }}<template v-if="index < facts.length - 1"> ·</template></span
      ></template
    >
  </span>
</template>
