<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import AdminBit from '../../shell/AdminBit.vue';
import { buttonClass } from '../../ui/controls';
import DeleteProblemDialog from './DeleteProblemDialog.vue';

/** The last card of the General tab: delete the problem after typing its code; the editor then shows the deleted list. */
defineProps<{ code: string }>();
const router = useRouter();
const isOpen = ref(false);
const showDeleted = () => void router.push({ name: 'admin-problemsDeleted' });
</script>

<template>
  <SettingsCard
    :title="$t('admin.lifecycle.danger.title')"
    :lead="$t('admin.lifecycle.danger.lead')"
  >
    <div class="flex flex-wrap items-center gap-3 rounded-row border border-negative p-4">
      <AdminBit placement="security" />
      <p class="min-w-0 flex-1 text-sm">{{ $t('admin.lifecycle.danger.body') }}</p>
      <button type="button" :class="buttonClass('danger')" @click="isOpen = true">
        {{ $t('admin.lifecycle.danger.open') }}
      </button>
    </div>
    <DeleteProblemDialog v-model:visible="isOpen" :code="code" @deleted="showDeleted" />
  </SettingsCard>
</template>
