<script setup lang="ts">
import { computed } from 'vue';
import AdminBit from '../../shell/AdminBit.vue';

const props = defineProps<{ feedback: string }>();
const lines = computed(() =>
  props.feedback
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean),
);
</script>

<template>
  <section
    v-if="lines.length > 0"
    role="alert"
    data-testid="data-feedback"
    class="flex flex-col gap-2 rounded-panel border border-negative p-4"
  >
    <h2 class="flex items-center gap-2 font-semibold">
      <AdminBit placement="refused" />{{ $t('admin.problems.data.feedback.title') }}
    </h2>
    <ul class="list-disc pl-5 text-sm">
      <li v-for="(line, index) in lines" :key="index">{{ line }}</li>
    </ul>
  </section>
</template>
