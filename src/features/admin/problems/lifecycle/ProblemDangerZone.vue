<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { deleteProblem } from '@/api/problem-lifecycle.api';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import AdminBit from '../../shell/AdminBit.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { ADMIN_DANGER_CLASS } from '../../ui/classes';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { PROBLEM_INDEX_KEY, PUBLIC_PROBLEMS_KEY } from '../problem-editing.queries';
import { DELETED_PROBLEMS_KEY, SUBMISSIONS_KEY } from './lifecycle.queries';
import TypedCodeDialog from './TypedCodeDialog.vue';

/** The last card of the General tab: delete the problem after typing its code; the editor then shows the deleted list. */
const props = defineProps<{ code: string }>();
const router = useRouter();
const isOpen = ref(false);
const remove = useAdminMutation({
  mutate: (confirmCode: string) => deleteProblem(props.code, confirmCode),
  invalidates: () => [
    DELETED_PROBLEMS_KEY,
    PROBLEM_INDEX_KEY,
    PUBLIC_PROBLEMS_KEY,
    SUBMISSIONS_KEY,
  ],
  onDone: () => {
    isOpen.value = false;
    void router.push({ name: 'admin-problemsDeleted' });
  },
});
const failureText = computed(() =>
  remove.failure.value ? failureTextOf(remove.failure.value) : '',
);

function open() {
  remove.reset();
  isOpen.value = true;
}
</script>

<template>
  <SettingsCard
    :title="$t('admin.lifecycle.danger.title')"
    :lead="$t('admin.lifecycle.danger.lead')"
  >
    <div class="flex flex-wrap items-center gap-3 rounded-row border border-negative p-4">
      <AdminBit placement="security" />
      <p class="min-w-0 flex-1 text-sm">{{ $t('admin.lifecycle.danger.body') }}</p>
      <button type="button" :class="ADMIN_DANGER_CLASS" @click="open">
        {{ $t('admin.lifecycle.danger.open') }}
      </button>
    </div>
    <TypedCodeDialog
      v-model:visible="isOpen"
      :code="code"
      :title="$t('admin.lifecycle.danger.title2', { code })"
      :body="$t('admin.lifecycle.danger.dialogBody')"
      :confirm-label="$t('admin.lifecycle.danger.confirm')"
      :busy="remove.isPending.value"
      :failure-text="failureText"
      @confirm="remove.run"
    />
  </SettingsCard>
</template>
