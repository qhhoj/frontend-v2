<script setup lang="ts">
import { ref } from 'vue';
import type { EditableContest } from '@/api/types/contest-editing';
import { failureTextOf } from '../../ui/admin-errors';
import AdminStatus from '../../ui/AdminStatus.vue';
import { ADMIN_INPUT_CLASS, ADMIN_PRIMARY_CLASS } from '../../ui/classes';
import { labelFor } from './contest-problems';
import DraftLeaveDialog from '../../problems/drafts/DraftLeaveDialog.vue';
import { useDraftLeaveGuard } from '../../problems/drafts/use-draft-leave-guard';
import ContestProblemOpsCard from './ContestProblemOpsCard.vue';
import ContestProblemRow from './ContestProblemRow.vue';
import { useContestProblemRows } from './use-contest-problem-rows';

const props = defineProps<{ contest: EditableContest }>();
const {
  rows,
  addError,
  isAdding,
  isFull,
  addByCode,
  move,
  remove,
  save,
  mutation,
  issueFor,
  isDirty,
} = useContestProblemRows(() => props.contest);
const { isLeaveOpen, leaveAnyway } = useDraftLeaveGuard(() => isDirty.value);
const typedCode = ref('');

async function submitCode() {
  const code = typedCode.value.trim();
  if (code && (await addByCode(code))) typedCode.value = '';
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="glass overflow-x-auto rounded-panel p-3">
      <table class="w-full min-w-[760px] text-sm">
        <thead class="text-left text-muted">
          <tr>
            <th scope="col" class="px-2 py-2">{{ $t('admin.contests.problems.columns.label') }}</th>
            <th scope="col" class="px-2 py-2">
              {{ $t('admin.contests.problems.columns.problem') }}
            </th>
            <th scope="col" class="px-2 py-2">
              {{ $t('admin.contests.problems.columns.points') }}
            </th>
            <th scope="col" class="px-2 py-2">
              {{ $t('admin.contests.problems.columns.partial') }}
            </th>
            <th scope="col" class="px-2 py-2">
              {{ $t('admin.contests.problems.columns.pretest') }}
            </th>
            <th scope="col" class="px-2 py-2">
              {{ $t('admin.contests.problems.columns.prefix') }}
            </th>
            <th scope="col" class="px-2 py-2">
              {{ $t('admin.contests.problems.columns.maxSubmissions') }}
            </th>
            <th scope="col" class="px-2 py-2">{{ $t('admin.contests.problems.columns.order') }}</th>
          </tr>
        </thead>
        <tbody>
          <ContestProblemRow
            v-for="(row, index) in rows"
            :key="row.problemId"
            v-model="rows[index]!"
            :label="labelFor(index, contest.labelStyle)"
            :issue="issueFor(index)"
            :is-first="index === 0"
            :is-last="index === rows.length - 1"
            @move="(delta) => move(index, delta)"
            @remove="remove(index)"
          />
        </tbody>
      </table>
    </div>

    <div class="flex flex-col gap-2">
      <label for="contest-add-problem" class="text-sm font-semibold">{{
        $t('admin.contests.problems.addLabel')
      }}</label>
      <input
        id="contest-add-problem"
        v-model="typedCode"
        :class="ADMIN_INPUT_CLASS"
        :placeholder="
          isFull ? $t('admin.contests.problems.full') : $t('admin.contests.problems.addPlaceholder')
        "
        :disabled="isFull || isAdding"
        :aria-describedby="addError ? 'contest-add-problem-error' : undefined"
        autocomplete="off"
        @keydown.enter.prevent="submitCode"
      />
      <p v-if="addError" id="contest-add-problem-error" class="text-sm text-negative">
        {{ addError }}
      </p>
    </div>

    <div class="flex flex-col gap-1 text-sm text-muted">
      <p>{{ $t('admin.contests.problems.orderLine') }}</p>
      <p>{{ $t('admin.contests.problems.prefixLine') }}</p>
      <p>
        {{ $t('admin.contests.problems.rescoreWarning') }}
        <RouterLink
          :to="{ name: 'admin-contestActions', params: { key: contest.key } }"
          class="underline"
          >{{ $t('admin.contests.problems.rescoreLink') }}</RouterLink
        >
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <button type="button" :class="ADMIN_PRIMARY_CLASS" @click="save">
        {{ $t('admin.contests.problems.save') }}
      </button>
      <AdminStatus v-if="mutation.isDone.value" kind="done" :text="$t('admin.ui.saved')" />
      <AdminStatus
        v-if="mutation.failure.value"
        kind="refused"
        :text="failureTextOf(mutation.failure.value)"
      />
      <span v-if="isDirty" class="text-sm text-muted">{{ $t('admin.contestOps.unsaved') }}</span>
    </div>

    <ContestProblemOpsCard :contest="contest" />
    <DraftLeaveDialog v-model:visible="isLeaveOpen" @leave="leaveAnyway" />
  </div>
</template>
