<script setup lang="ts">
import { computed } from 'vue';
import AdminNotice from '../../ui/feedback/AdminNotice.vue';

const props = defineProps<{ feedback: string }>();
const lines = computed(() =>
  props.feedback
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean),
);
</script>

<template>
  <div v-if="lines.length > 0" role="alert" data-testid="data-feedback">
    <AdminNotice tone="danger" :title="$t('admin.problems.data.feedback.title')">
      <template #action>
        <ul class="mt-1 list-disc pl-5">
          <li v-for="(line, index) in lines" :key="index">{{ line }}</li>
        </ul>
      </template>
    </AdminNotice>
  </div>
</template>
