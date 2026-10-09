<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Trash2 } from 'lucide-vue-next';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { updateSetting } from '@/api/settings-admin.api';
import type { Setting } from '@/api/types/settings-admin';
import { failureTextOf } from '../ui/admin-errors';
import { ADMIN_DANGER_CLASS } from '../ui/classes';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { clearConsequences, clearValueOf } from './setting-clear';

/** The only way to empty a sealed setting: a button of its own, and a confirm that names what stops. */
const props = defineProps<{ setting: Setting }>();
const emit = defineEmits<{ cleared: [answer: Setting] }>();
const { t } = useI18n();
const isOpen = ref(false);
const name = computed(() => t(`admin.settings.clear.names.${props.setting.key}`));

const clearing = useAdminMutation<void, Setting>({
  mutate: () => updateSetting(props.setting.key, clearValueOf(props.setting)),
  onDone: (answer) => {
    isOpen.value = false;
    emit('cleared', answer);
  },
});

function open() {
  clearing.reset();
  isOpen.value = true;
}
</script>

<template>
  <button type="button" :class="ADMIN_DANGER_CLASS" @click="open">
    <Trash2 aria-hidden="true" class="size-4" />{{ t('admin.settings.clear.button') }}
  </button>
  <ConfirmDialog
    v-model:visible="isOpen"
    tone="danger"
    :title="t('admin.settings.clear.title', { name })"
    :confirm-label="
      clearing.isPending.value
        ? t('admin.settings.clear.clearing')
        : t('admin.settings.clear.confirm', { name })
    "
    :busy="clearing.isPending.value"
    @confirm="clearing.run()"
  >
    <p>{{ t('admin.settings.clear.lead', { key: setting.key }) }}</p>
    <ul class="list-disc pl-5 text-sm text-muted">
      <li v-for="id in clearConsequences(setting)" :key="id">
        {{ t(`admin.settings.clear.consequences.${id}`) }}
      </li>
    </ul>
    <template #error>
      <p v-if="clearing.failure.value" role="alert" class="text-sm text-negative">
        {{ failureTextOf(clearing.failure.value) }}
      </p>
    </template>
  </ConfirmDialog>
</template>
