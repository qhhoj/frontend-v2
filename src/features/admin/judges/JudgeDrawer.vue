<script setup lang="ts">
import type { Judge } from '@/api/types/judges-admin';
import AdminDrawer from '../ui/AdminDrawer.vue';
import JudgeDetails from './JudgeDetails.vue';
import JudgeStatusChip from './JudgeStatusChip.vue';
import { useJudgeWrites } from './judges.mutations';

/** One judge's details (protocol, runtimes, description) in the side drawer; the description saves from here. */
const props = defineProps<{ judge: Judge | null }>();
const visible = defineModel<boolean>('visible', { required: true });
const writes = useJudgeWrites();

function saveDescription(description: string) {
  if (props.judge) void writes.patch.run({ name: props.judge.name, patch: { description } });
}
</script>

<template>
  <AdminDrawer
    v-model:visible="visible"
    :title="judge?.name ?? ''"
    :subtitle="judge?.description || undefined"
  >
    <template v-if="judge" #meta>
      <JudgeStatusChip :judge="judge" />
    </template>
    <JudgeDetails
      v-if="judge"
      :key="judge.name"
      :judge="judge"
      :is-saving="writes.patch.isPending.value"
      @save-description="saveDescription"
    />
  </AdminDrawer>
</template>
