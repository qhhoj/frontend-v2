<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { deleteProblem } from '@/api/problem-lifecycle.api';
import { failureTextOf } from '../../ui/admin-errors';
import { CARD, buttonClass } from '../../ui/controls';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { PROBLEM_INDEX_KEY, PUBLIC_PROBLEMS_KEY } from '../problem-editing.queries';
import { DELETED_PROBLEMS_KEY, SUBMISSIONS_KEY } from './lifecycle.queries';
import TypedCodeDialog from './TypedCodeDialog.vue';

/** The General tab's last card (danger section): delete the problem after typing its code; the editor then shows the deleted list. */
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
          @click="open"
        >
          {{ $t('admin.lifecycle.danger.open') }}
        </button>
      </div>
    </AdminFormSection>
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
  </div>
</template>
