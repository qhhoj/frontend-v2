<script setup lang="ts">
import { computed, reactive } from 'vue';
import ContinueContestRow from './ContinueContestRow.vue';
import ContinueProblemRow from './ContinueProblemRow.vue';
import { continueRecords, recordOf } from './continue-records';
import type { ContinueRecord } from './continue-records';
import { useRecentScreens } from './recent-screens';
import { useIsOpenable } from './use-openable';

/**
 * "Tiếp tục": the last problems and contests this account had open, newest first, each with its state and the tab it was
 * on. From this browser's visits; a record whose editor the viewer can no longer open is left out.
 */
const { recent, forget } = useRecentScreens();
const isOpenable = useIsOpenable();
const records = computed(() =>
  continueRecords(recent.value.filter((entry) => isOpenable(entry.path))),
);
/** Records whose row has data: the block shows once one has, so it never stands as a heading over nothing. */
const ready = reactive(new Set<string>());
const keyOf = (record: Pick<ContinueRecord, 'kind' | 'id'>) => `${record.kind}:${record.id}`;
/** A gone record leaves the stored list, so the next older one fills its place and the requests are not repeated. */
function onGone(record: ContinueRecord) {
  forget((path) => {
    const other = recordOf(path);
    return other !== null && keyOf(other) === keyOf(record);
  });
}
</script>

<template>
  <section
    v-show="ready.size > 0"
    aria-labelledby="admin-continue-title"
    class="flex flex-col gap-3"
    data-testid="admin-continue"
  >
    <h2 id="admin-continue-title" class="text-title leading-6 font-semibold">
      {{ $t('admin.shell.continue.title') }}
    </h2>
    <ul
      class="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface-solid"
    >
      <template v-for="record in records" :key="keyOf(record)">
        <ContinueProblemRow
          v-if="record.kind === 'problem'"
          :record="record"
          @ready="ready.add(keyOf(record))"
          @gone="onGone(record)"
        />
        <ContinueContestRow
          v-else
          :record="record"
          @ready="ready.add(keyOf(record))"
          @gone="onGone(record)"
        />
      </template>
    </ul>
  </section>
</template>
