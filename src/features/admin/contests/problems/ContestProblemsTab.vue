<script setup lang="ts">
import BulkSelectionBar from '../../ui/BulkSelectionBar.vue';
import { computed, ref } from 'vue';
import type { EditableContest } from '@/api/types/contest-editing';
import { failureTextOf } from '../../ui/admin-errors';
import AdminStatus from '../../ui/AdminStatus.vue';
import { ADMIN_BUTTON_CLASS, ADMIN_INPUT_CLASS, ADMIN_PRIMARY_CLASS } from '../../ui/classes';
import { checked, useRowSelection } from '../../ui/use-row-selection';
import { isPointsValid, labelFor } from './contest-problems';
import DraftLeaveDialog from '../../problems/drafts/DraftLeaveDialog.vue';
import { useDraftLeaveGuard } from '../../problems/drafts/use-draft-leave-guard';
import ContestProblemOpsCard from './ContestProblemOpsCard.vue';
import ContestProblemRow from './ContestProblemRow.vue';
import ProblemAddPicker from './ProblemAddPicker.vue';
import ProblemCopyFrom from './ProblemCopyFrom.vue';
import { useContestProblemRows } from './use-contest-problem-rows';

const props = defineProps<{ contest: EditableContest }>();
const {
  rows,
  addError,
  isAdding,
  isFull,
  addByCode,
  addFound,
  copyRows,
  move,
  moveTo,
  setPoints,
  remove,
  save,
  mutation,
  issueFor,
  isDirty,
} = useContestProblemRows(() => props.contest);
const { isLeaveOpen, leaveAnyway } = useDraftLeaveGuard(() => isDirty.value);
const listedIds = computed(() => rows.value.map((row) => row.problemId));

const selection = useRowSelection(listedIds);
const bulkPoints = ref<number | ''>('');
const isBulkPointsValid = computed(() => isPointsValid(bulkPoints.value));
function applyPoints() {
  if (typeof bulkPoints.value !== 'number' || !isBulkPointsValid.value) return;
  setPoints(selection.selected.value, bulkPoints.value);
}
function removeAt(index: number) {
  selection.toggle(rows.value[index]!.problemId, false);
  remove(index);
}
const HEAD = 'px-2 py-2';
</script>

<template>
  <div class="flex flex-col gap-5">
    <BulkSelectionBar :count="selection.selected.value.length" @clear="selection.clear">
      <label class="flex flex-col gap-1 text-sm font-semibold">
        {{ $t('admin.contests.problems.bulkPoints') }}
        <input
          id="contest-bulk-points"
          v-model.number="bulkPoints"
          type="number"
          min="0"
          :class="ADMIN_INPUT_CLASS"
          class="max-w-28"
          :aria-invalid="bulkPoints !== '' && !isBulkPointsValid ? 'true' : undefined"
          @keydown.enter.prevent="applyPoints"
        />
      </label>
      <button
        type="button"
        :class="ADMIN_BUTTON_CLASS"
        :disabled="!isBulkPointsValid"
        @click="applyPoints"
      >
        {{ $t('admin.contests.problems.applyPoints') }}
      </button>
    </BulkSelectionBar>

    <div class="glass rounded-panel p-3 md:overflow-x-auto">
      <table class="w-full text-sm md:min-w-[760px]">
        <thead class="text-left text-muted max-md:sr-only">
          <tr>
            <th scope="col" :class="HEAD">
              <span class="flex items-center gap-3">
                <input
                  type="checkbox"
                  class="size-5"
                  :checked="selection.isAllSelected.value"
                  :indeterminate="selection.isSomeSelected.value"
                  :aria-label="$t('admin.contests.bulk.selectPage')"
                  @change="selection.toggleAll(checked($event))"
                />
                {{ $t('admin.contests.problems.columns.label') }}
              </span>
            </th>
            <th scope="col" :class="HEAD">{{ $t('admin.contests.problems.columns.problem') }}</th>
            <th scope="col" :class="HEAD">{{ $t('admin.contests.problems.columns.points') }}</th>
            <th scope="col" :class="HEAD">{{ $t('admin.contests.problems.columns.partial') }}</th>
            <th scope="col" :class="HEAD">{{ $t('admin.contests.problems.columns.pretest') }}</th>
            <th scope="col" :class="HEAD">{{ $t('admin.contests.problems.columns.prefix') }}</th>
            <th scope="col" :class="HEAD">
              {{ $t('admin.contests.problems.columns.maxSubmissions') }}
            </th>
            <th scope="col" :class="HEAD">{{ $t('admin.contests.problems.columns.order') }}</th>
          </tr>
        </thead>
        <tbody>
          <ContestProblemRow
            v-for="(row, index) in rows"
            :key="row.problemId"
            v-model="rows[index]!"
            :label="labelFor(index, contest.labelStyle)"
            :issue="issueFor(index)"
            :position="index + 1"
            :count="rows.length"
            :is-selected="selection.isSelected(row.problemId)"
            @move="(delta) => move(index, delta)"
            @move-to="(position) => moveTo(index, position - 1)"
            @remove="removeAt(index)"
            @select="(isOn) => selection.toggle(row.problemId, isOn)"
          />
        </tbody>
      </table>
    </div>

    <div class="grid gap-5 lg:grid-cols-2">
      <ProblemAddPicker
        :listed-ids="listedIds"
        :is-full="isFull"
        :is-adding="isAdding"
        :error="addError"
        :add-by-code="addByCode"
        @pick="addFound"
      />
      <ProblemCopyFrom :current-key="contest.key" :copy="copyRows" />
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
