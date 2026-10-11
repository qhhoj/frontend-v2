<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { CARD, buttonClass } from '../../ui/controls';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import DeleteProblemDialog from './DeleteProblemDialog.vue';

/** The General tab's last card (danger section): delete the problem after typing its code; the editor then shows the deleted list. */
defineProps<{ code: string }>();
const router = useRouter();
const isOpen = ref(false);
const showDeleted = () => void router.push({ name: 'admin-problemsDeleted' });
</script>

<template>
  <div :class="CARD">
    <AdminFormSection
      :title="$t('admin.lifecycle.danger.title')"
      :description="$t('admin.lifecycle.danger.lead')"
      :columns="1"
      danger
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="min-w-0 text-sm text-muted sm:max-w-xl">
          {{ $t('admin.lifecycle.danger.body') }}
        </p>
        <button
          type="button"
          :class="[buttonClass('danger'), 'self-start sm:self-auto']"
          @click="isOpen = true"
        >
          {{ $t('admin.lifecycle.danger.open') }}
        </button>
      </div>
    </AdminFormSection>
    <DeleteProblemDialog v-model:visible="isOpen" :code="code" @deleted="showDeleted" />
  </div>
</template>
