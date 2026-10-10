<script setup lang="ts">
import { computed } from 'vue';
import { failureTextOf } from '../../ui/admin-errors';
import AdminStatus from '../../ui/AdminStatus.vue';
import { ADMIN_PRIMARY_CLASS } from '../../ui/classes';
import type { EditableContest } from '@/api/types/contest-editing';
import ContestGeneralForm from './ContestGeneralForm.vue';
import { useContestForm } from './use-contest-form';

const props = defineProps<{ contest: EditableContest }>();
const { form, errors, isDirty, save, mutation } = useContestForm(() => props.contest);
const hasCodes = computed(() => ({
  access: props.contest.requiresAccessCode,
  ranking: props.contest.settings?.hasRankingAccessCode ?? false,
}));
</script>

<template>
  <form class="flex flex-col gap-6" @submit.prevent="save">
    <fieldset
      :disabled="mutation.isPending.value"
      class="m-0 flex min-w-0 flex-col gap-6 border-0 p-0"
    >
      <ContestGeneralForm
        v-model="form"
        :errors="errors"
        :is-create="false"
        :has-codes="hasCodes"
      />
    </fieldset>
    <div
      class="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-line bg-surface-solid py-3"
    >
      <button type="submit" :class="ADMIN_PRIMARY_CLASS" :aria-disabled="!isDirty || undefined">
        {{ $t('admin.ui.save') }}
      </button>
      <AdminStatus v-if="mutation.isDone.value" kind="done" :text="$t('admin.ui.saved')" />
      <AdminStatus
        v-if="mutation.failure.value"
        kind="refused"
        :text="failureTextOf(mutation.failure.value)"
      />
    </div>
  </form>
</template>
