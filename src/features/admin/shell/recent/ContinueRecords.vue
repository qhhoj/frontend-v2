<script setup lang="ts">
import { computed } from 'vue';
import ContinueContestRow from './ContinueContestRow.vue';
import ContinueProblemRow from './ContinueProblemRow.vue';
import { continueRecords } from './continue-records';
import { useRecentScreens } from './recent-screens';
import { useIsOpenable } from './use-openable';

/**
 * "Tiếp tục": the last problems and contests this account had open, newest first, each with its state and the tab it was
 * on. From this browser's visits; a record whose editor the viewer can no longer open is left out.
 */
const { recent } = useRecentScreens();
const isOpenable = useIsOpenable();
const records = computed(() =>
  continueRecords(recent.value.filter((entry) => isOpenable(entry.path))),
);
</script>

<template>
  <section
    v-if="records.length > 0"
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
      <template v-for="record in records" :key="`${record.kind}:${record.id}`">
        <ContinueProblemRow v-if="record.kind === 'problem'" :record="record" />
        <ContinueContestRow v-else :record="record" />
      </template>
    </ul>
  </section>
</template>
