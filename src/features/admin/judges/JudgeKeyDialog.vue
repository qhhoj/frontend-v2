<script setup lang="ts">
import { computed } from 'vue';
import { translate } from '@/i18n';
import RevealKeyDialog from '../ui/RevealKeyDialog.vue';

/** A judge's auth key, shown once (see `RevealKeyDialog`). */
defineProps<{ visible: boolean; header: string; authKey: string }>();
defineEmits<{ close: [] }>();
const texts = computed(() => ({
  warning: translate('admin.judges.key.warning'),
  label: translate('admin.judges.key.label'),
  saved: translate('admin.judges.key.saved'),
  close: translate('admin.judges.key.close'),
  copy: translate('admin.judges.key.copy'),
}));
</script>

<template>
  <RevealKeyDialog
    :visible="visible"
    :header="header"
    :auth-key="authKey"
    :texts="texts"
    @close="$emit('close')"
  />
</template>
