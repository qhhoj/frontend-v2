<script setup lang="ts">
import { ref } from 'vue';
import type { EditableContest } from '@/api/types/contest-editing';
import { usePermissions } from '@/stores/use-permissions';
import { CARD, buttonClass } from '../../ui/controls';
import { needsPermissionText } from '../../ui/permission-text';
import ContestCloneDialog from '../lifecycle/ContestCloneDialog.vue';

/** "Nhân bản kỳ thi" on the Actions tab: the same dialog as the row menu and the editor header. */
defineProps<{ contest: EditableContest }>();
const { can } = usePermissions();
const isOpen = ref(false);
</script>

<template>
  <section data-testid="action-clone" :class="[CARD, 'flex flex-col gap-3 p-5']">
    <h3 class="m-0 text-base font-semibold">
      {{ $t('admin.contests.actions.clone.title') }}
    </h3>
    <p class="text-sm text-muted">{{ $t('admin.contests.actions.clone.description') }}</p>
    <p v-if="!can('judge.clone_contest')" class="text-sm text-muted">
      {{ needsPermissionText('judge.clone_contest') }}
    </p>
    <button
      v-else
      type="button"
      :class="buttonClass('primary')"
      class="self-start"
      @click="isOpen = true"
    >
      {{ $t('admin.contests.actions.clone.button') }}
    </button>
    <ContestCloneDialog v-model:visible="isOpen" :source="contest" />
  </section>
</template>
