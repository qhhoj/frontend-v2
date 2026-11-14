<script setup lang="ts">
import QueryState from '@/components/QueryState.vue';
import Modal from '@/components/ui/Modal.vue';
import { useInitYamlQuery } from './problem-data.queries';

const isOpen = defineModel<boolean>('visible', { required: true });
const props = defineProps<{ code: string }>();
const init = useInitYamlQuery(
  () => props.code,
  () => isOpen.value,
);
</script>

<template>
  <Modal v-model:visible="isOpen" :title="$t('admin.problems.data.init.title')" size="md">
    <QueryState
      :loading="init.isPending.value"
      :error="init.error.value"
      @retry="() => void init.refetch()"
    >
      <pre
        class="max-h-[60vh] overflow-auto rounded-cell bg-surface-strong p-3 font-mono text-sm"
        >{{ init.data.value }}</pre>
    </QueryState>
  </Modal>
</template>
