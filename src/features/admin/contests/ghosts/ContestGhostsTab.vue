<script setup lang="ts">
import { computed } from 'vue';
import type { EditableContest } from '@/api/types/contest-editing';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AdminBit from '../../shell/AdminBit.vue';
import GhostCurrentCard from './GhostCurrentCard.vue';
import GhostImportCard from './GhostImportCard.vue';
import { useGhostsQuery } from './ghosts.queries';

/** Staff ghost rows of a past contest (spec 3.4). Final-submission contests have none: the server answers 409, so nothing is asked. */
const props = defineProps<{ contest: EditableContest }>();
const key = computed(() => props.contest.key);
const isSupported = computed(() => props.contest.formatName !== 'final_submission');
const { data, error, isPending, refetch } = useGhostsQuery(key, isSupported);
const ghosts = computed(() => data.value?.ghosts ?? []);
</script>

<template>
  <p
    v-if="!isSupported"
    data-testid="ghost-unsupported"
    class="glass flex flex-wrap items-center gap-3 rounded-panel p-5"
  >
    <AdminBit placement="forbidden" />
    <span>{{ $t('admin.ghosts.unsupported') }}</span>
  </p>
  <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
    <template #skeleton>
      <div data-ghost-part="grid" class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SkeletonBlock data-skeleton-region="ghost-import" class="h-80 w-full" />
        <SkeletonBlock data-skeleton-region="ghost-current" class="h-80 w-full" />
      </div>
    </template>
    <div data-ghost-part="grid" class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <GhostImportCard :contest-key="contest.key" :current-count="ghosts.length" />
      <GhostCurrentCard :contest-key="contest.key" :ghosts="ghosts" />
    </div>
  </QueryState>
</template>
