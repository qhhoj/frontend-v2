<script setup lang="ts">
import { ref } from 'vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AdminStatus from '../ui/AdminStatus.vue';

defineProps<{ judgeName: string; isBusy: boolean; failureText: string | null }>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ confirm: [force: boolean] }>();
const isForced = ref(false);
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    tone="danger"
    :title="$t('admin.judges.disconnect.title', { name: judgeName })"
    :body="$t('admin.judges.disconnect.body')"
    :confirm-label="$t('admin.judges.disconnect.confirm')"
    :busy="isBusy"
    @confirm="emit('confirm', isForced)"
  >
    <label class="flex items-center gap-2">
      <input id="disconnect-force" v-model="isForced" type="checkbox" class="size-5" />
      {{ $t('admin.judges.disconnect.force') }}
    </label>
    <template v-if="failureText" #error>
      <AdminStatus kind="refused" :text="failureText" />
    </template>
  </ConfirmDialog>
</template>
