<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { EditableContest } from '@/api/types/contest-editing';
import { buttonClass } from '../../ui/controls';
import ContestDeleteDialog from '../lifecycle/ContestDeleteDialog.vue';
import { deleteBlockedBy } from '../lifecycle/contest-delete';

/** The danger zone: deletes a hidden contest after its key is typed again; a visible one says why it cannot. */
const props = defineProps<{ contest: EditableContest }>();
const router = useRouter();
const isOpen = ref(false);
const blockedBy = computed(() => deleteBlockedBy(props.contest.settings?.isVisible));
</script>

<template>
  <section
    data-testid="action-delete"
    class="flex flex-col gap-3 rounded-panel border border-negative bg-surface-solid p-5"
  >
    <h3 class="m-0 text-base font-semibold text-negative">
      {{ $t('admin.contestOps.delete.title') }}
    </h3>
    <p class="text-sm text-muted">{{ $t('admin.contestOps.delete.description') }}</p>
    <p v-if="blockedBy" class="text-sm text-muted">{{ blockedBy }}</p>
    <button
      v-else
      type="button"
      :class="buttonClass('danger')"
      class="self-start"
      @click="isOpen = true"
    >
      {{ $t('admin.contestOps.delete.button') }}
    </button>
    <ContestDeleteDialog
      v-model:visible="isOpen"
      :contest-key="contest.key"
      @deleted="router.push({ name: 'admin-contests' })"
    />
  </section>
</template>
