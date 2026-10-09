<script setup lang="ts">
import Dialog from 'primevue/dialog';
import QueryState from '@/components/QueryState.vue';
import { useInitYamlQuery } from './problem-data.queries';

const isOpen = defineModel<boolean>('visible', { required: true });
const props = defineProps<{ code: string }>();
const init = useInitYamlQuery(
  () => props.code,
  () => isOpen.value,
);
</script>

<template>
  <Dialog
    v-model:visible="isOpen"
    modal
    :header="$t('admin.problems.data.init.title')"
    :draggable="false"
    :close-button-props="{ 'aria-label': $t('common.close') }"
    class="w-[min(40rem,calc(100vw-2rem))]"
  >
    <QueryState
      :loading="init.isPending.value"
      :error="init.error.value"
      @retry="() => void init.refetch()"
    >
      <pre
        class="max-h-[60vh] overflow-auto rounded-tile bg-surface-strong p-3 font-mono text-sm"
        >{{ init.data.value }}</pre>
    </QueryState>
  </Dialog>
</template>
