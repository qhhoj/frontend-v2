<script setup lang="ts">
import type { EditableProblem, ProblemEditingMeta } from '@/api/types/problem-editing';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { ADMIN_PRIMARY_CLASS } from '../../ui/classes';
import CasesEditor from './CasesEditor.vue';
import CheckerSection from './CheckerSection.vue';
import DataArchiveCard from './DataArchiveCard.vue';
import DataFeedback from './DataFeedback.vue';
import { useDataForm } from './use-data-form';

const props = defineProps<{ problem: EditableProblem; meta: ProblemEditingMeta }>();
const { query, form, errors, badRowNumbers, markInvalid, save, mutation } = useDataForm(
  () => props.problem.code,
);
</script>

<template>
  <QueryState
    :loading="query.isPending.value"
    :error="query.error.value"
    @retry="() => void query.refetch()"
  >
    <template #skeleton>
      <SkeletonBlock data-skeleton-region="problem-data-card" class="h-40 w-full rounded-panel" />
      <SkeletonBlock data-skeleton-region="problem-data-cases" class="h-96 w-full rounded-panel" />
    </template>
    <form
      v-if="query.data.value && form"
      class="flex flex-col gap-5"
      novalidate
      @submit.prevent="save"
    >
      <DataArchiveCard :code="problem.code" :data="query.data.value" />
      <DataFeedback :feedback="query.data.value.feedback" />
      <CheckerSection
        v-model="form"
        :errors="errors"
        :has-custom-checker="query.data.value.customChecker !== null"
      />
      <CasesEditor v-model="form.cases" :data="query.data.value" @invalid="markInvalid" />
      <div
        class="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-line bg-surface-solid py-3"
      >
        <p v-if="badRowNumbers.length > 0" role="alert" class="text-sm text-negative">
          {{ $t('admin.problems.data.cases.badJsonRows', { rows: badRowNumbers.join(', ') }) }}
        </p>
        <AdminStatus
          v-else-if="mutation.failure.value"
          kind="refused"
          :text="failureTextOf(mutation.failure.value)"
        />
        <AdminStatus v-else-if="mutation.isDone.value" kind="done" :text="$t('admin.ui.saved')" />
        <button
          type="submit"
          class="ml-auto"
          :class="ADMIN_PRIMARY_CLASS"
          :aria-disabled="mutation.isPending.value ? 'true' : undefined"
        >
          {{ $t('admin.problems.data.save') }}
        </button>
      </div>
    </form>
  </QueryState>
</template>
