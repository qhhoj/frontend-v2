<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import type { EditableContest } from '@/api/types/contest-editing';
import BulkSelectionBar from '../../ui/BulkSelectionBar.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { CARD, INPUT, buttonClass } from '../../ui/controls';
import AdminLeaveGuard from '../../ui/form/AdminLeaveGuard.vue';
import AdminSaveBar from '../../ui/form/AdminSaveBar.vue';
import { checked, useRowSelection } from '../../ui/use-row-selection';
import ContestProblemOpsCard from './ContestProblemOpsCard.vue';
import ContestProblemRow from './ContestProblemRow.vue';
import ProblemAddPicker from './ProblemAddPicker.vue';
import ProblemCopyFrom from './ProblemCopyFrom.vue';
import { isPointsValid, labelFor } from './contest-problems';
import { useContestProblemRows } from './use-contest-problem-rows';

/**
 * The contest's problem list as one draft: edit rows in place, add by code or copy from another contest, then save the
 * whole list. From 1536 px the add and copy tools and the per-problem operations sit in a rail beside the table.
 */
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
  discard,
  mutation,
  issueFor,
  dirtyCount,
  savedAt,
} = useContestProblemRows(() => props.contest);
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
const formId = useId();
const HEAD = 'px-2 py-2 text-xs font-semibold tracking-wide uppercase';
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- The save bar submits this empty form: the add and copy tools are forms of their own. -->
    <form :id="formId" class="hidden" novalidate @submit.prevent="save" />
    <div class="grid items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div class="flex min-w-0 flex-col gap-3">
        <BulkSelectionBar :count="selection.selected.value.length" @clear="selection.clear">
          <label class="flex items-center gap-2 text-sm font-semibold">
            {{ $t('admin.contests.problems.bulkPoints') }}
            <input
              id="contest-bulk-points"
              v-model.number="bulkPoints"
              type="number"
              min="0"
              :class="[INPUT, 'max-w-28 font-mono tabular-nums']"
              :aria-invalid="bulkPoints !== '' && !isBulkPointsValid ? 'true' : undefined"
              @keydown.enter.prevent="applyPoints"
            />
          </label>
          <button
            type="button"
            :class="buttonClass('secondary', 'sm')"
            :disabled="!isBulkPointsValid"
            @click="applyPoints"
          >
            {{ $t('admin.contests.problems.applyPoints') }}
          </button>
        </BulkSelectionBar>

        <div :class="[CARD, 'px-3 py-1 md:overflow-x-auto']">
          <table class="w-full text-sm md:min-w-[720px]">
            <caption class="sr-only">
              {{
                $t('admin.contests.problems.tableLabel')
              }}
            </caption>
            <thead class="text-left text-muted max-md:sr-only">
              <tr>
                <th scope="col" :class="HEAD">
                  <span class="flex items-center gap-3">
                    <input
                      type="checkbox"
                      class="size-4 accent-[var(--qh-accent)]"
                      :checked="selection.isAllSelected.value"
                      :indeterminate="selection.isSomeSelected.value"
                      :aria-label="$t('admin.contests.bulk.selectPage')"
                      @change="selection.toggleAll(checked($event))"
                    />
                    {{ $t('admin.contests.problems.columns.label') }}
                  </span>
                </th>
                <th scope="col" :class="HEAD">
                  {{ $t('admin.contests.problems.columns.problem') }}
                </th>
                <th scope="col" :class="HEAD">
                  {{ $t('admin.contests.problems.columns.points') }}
                </th>
                <th scope="col" :class="HEAD">
                  {{ $t('admin.contests.problems.columns.partial') }}
                </th>
                <th scope="col" :class="HEAD">
                  {{ $t('admin.contests.problems.columns.pretest') }}
                </th>
                <th scope="col" :class="HEAD">
                  {{ $t('admin.contests.problems.columns.prefix') }}
                </th>
                <th scope="col" :class="HEAD">
                  {{ $t('admin.contests.problems.columns.maxSubmissions') }}
                </th>
                <th scope="col" :class="HEAD">
                  {{ $t('admin.contests.problems.columns.order') }}
                </th>
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
          <p v-if="rows.length === 0" class="m-0 px-2 py-6 text-center text-sm text-muted">
            {{ $t('admin.contests.problems.empty') }}
          </p>
        </div>
        <ul class="m-0 flex list-none flex-col gap-1 p-0 text-xs text-muted">
          <li>{{ $t('admin.contests.problems.orderLine') }}</li>
          <li>{{ $t('admin.contests.problems.prefixLine') }}</li>
          <li>
            {{ $t('admin.contests.problems.rescoreWarning') }}
            <RouterLink
              :to="{ name: 'admin-contestActions', params: { key: contest.key } }"
              class="font-semibold text-accent-text underline"
              >{{ $t('admin.contests.problems.rescoreLink') }}</RouterLink
            >
          </li>
        </ul>
      </div>

      <aside
        class="grid min-w-0 items-start gap-4 lg:grid-cols-3 2xl:flex 2xl:flex-col"
        :aria-label="$t('admin.contests.problems.tools')"
      >
        <ProblemAddPicker
          :listed-ids="listedIds"
          :is-full="isFull"
          :is-adding="isAdding"
          :error="addError"
          :add-by-code="addByCode"
          @pick="addFound"
        />
        <ProblemCopyFrom :current-key="contest.key" :copy="copyRows" />
        <ContestProblemOpsCard :contest="contest" />
      </aside>
    </div>

    <AdminStatus
      v-if="mutation.failure.value"
      kind="refused"
      :text="failureTextOf(mutation.failure.value)"
    />
    <AdminSaveBar
      :dirty-count="dirtyCount"
      :pending="mutation.isPending.value"
      :saved-at="savedAt"
      :save-label="$t('admin.contests.problems.save')"
      :form="formId"
      @discard="discard"
    />
    <AdminLeaveGuard :dirty-count="dirtyCount" />
  </div>
</template>
