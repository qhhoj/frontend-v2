<script setup lang="ts">
import type { Judge } from '@/api/types/judges-admin';
import { ADMIN_BUTTON_CLASS, ADMIN_DANGER_CLASS } from '../ui/classes';

defineProps<{ judge: Judge; isBusy: boolean }>();
const emit = defineEmits<{
  toggleDisabled: [];
  unblock: [];
  askBlock: [];
  askRotate: [];
  askDisconnect: [];
}>();
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      type="button"
      :class="ADMIN_BUTTON_CLASS"
      :aria-busy="isBusy || undefined"
      @click="emit('toggleDisabled')"
    >
      {{ judge.isDisabled ? $t('admin.judges.row.enable') : $t('admin.judges.row.disable') }}
    </button>
    <button
      v-if="judge.isBlocked"
      type="button"
      :class="ADMIN_BUTTON_CLASS"
      :aria-busy="isBusy || undefined"
      @click="emit('unblock')"
    >
      {{ $t('admin.judges.row.unblock') }}
    </button>
    <button v-else type="button" :class="ADMIN_DANGER_CLASS" @click="emit('askBlock')">
      {{ $t('admin.judges.row.block') }}
    </button>
    <button type="button" :class="ADMIN_DANGER_CLASS" @click="emit('askRotate')">
      {{ $t('admin.judges.row.rotate') }}
    </button>
    <button type="button" :class="ADMIN_BUTTON_CLASS" @click="emit('askDisconnect')">
      {{ $t('admin.judges.row.disconnect') }}
    </button>
  </div>
</template>
