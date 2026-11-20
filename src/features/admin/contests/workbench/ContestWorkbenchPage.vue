<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AdminBit from '../../shell/AdminBit.vue';
import { isNotFound } from '../../ui/admin-errors';
import { useEditableContestQuery } from '../contest-editing.queries';
import ContestWorkbench from './ContestWorkbench.vue';

/**
 * The route of the contest workbench (every old tab address leads here): reads the contest, then shows the workbench.
 * The workbench is keyed by the contest's key: another contest starts clean.
 */
const route = useRoute();
const key = computed(() => String(route.params.key));
const { data: contest, error, isPending, refetch } = useEditableContestQuery(key);
const isMissing = computed(() => isNotFound(error.value));
const canEdit = computed(() =>
  Boolean(contest.value?.viewer.canEdit && contest.value.settings !== null),
);
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="isMissing" role="alert" class="flex flex-wrap items-center gap-3">
      <AdminBit placement="refused" />
      <span>{{ $t('admin.contests.notFound', { key }) }}</span>
      <AppButton :to="{ name: 'admin-contests' }">{{ $t('admin.contests.backToList') }}</AppButton>
    </div>
    <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <SkeletonBlock
          data-skeleton-region="contest-workbench-plate"
          class="h-40 w-full rounded-row"
        />
        <SkeletonBlock
          data-skeleton-region="contest-workbench-body"
          class="h-96 w-full rounded-row"
        />
      </template>
      <template v-if="contest">
        <p v-if="!canEdit" role="alert" class="flex items-center gap-3">
          <AdminBit placement="forbidden" />{{ $t('admin.contests.cannotEdit', { key }) }}
        </p>
        <ContestWorkbench v-else :key="contest.key" :contest="contest" />
      </template>
    </QueryState>
  </div>
</template>
