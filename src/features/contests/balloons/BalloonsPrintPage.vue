<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { PRINT_BATCH_SIZE } from '@/api/balloons.api';
import { ApiError } from '@/api/client';
import EmptyState from '@/components/EmptyState.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import StatePanel from '@/components/StatePanel.vue';
import { ratingTextClass } from '@/lib/tier-classes';
import { EXTRAS_BITS } from '../contest-extras-bits';
import { useBalloonsQuery } from '../contest-extras.queries';
import { useContestQuery } from '../contests.queries';
import { balloonRowId, solvedAtText, swatchClassOf } from './balloon-queue';

/** The runners' sheet: the next ten pending balloons in queue order, large, without the site header (`layout: 'auth'`). */
const route = useRoute();
const key = computed(() => String(route.params.key));
const { data: contest } = useContestQuery(key);
const {
  data: queue,
  error,
  isPending,
  refetch,
} = useBalloonsQuery(key, { state: 'pending', page: 1, pageSize: PRINT_BATCH_SIZE });
const isMissing = computed(() => error.value instanceof ApiError && error.value.status === 404);
const isRefused = computed(() => error.value instanceof ApiError && error.value.status === 403);
const printSheet = () => window.print();
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-8 print:max-w-none print:p-0">
    <StatePanel
      v-if="isMissing"
      kind="notFound"
      is-page-heading
      :title="$t('balloons.missingTitle')"
      :body="$t('balloons.missingBody')"
    />
    <StatePanel
      v-else-if="isRefused"
      kind="forbidden"
      is-page-heading
      :title="$t('balloons.forbiddenTitle')"
      :body="$t('balloons.forbiddenBody')"
    />
    <template v-else>
      <header class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="page-title">
          {{ $t('balloons.printTitle', { contest: contest?.name ?? key }) }}
        </h1>
        <div class="flex gap-2 print:hidden">
          <RouterLink
            :to="{ name: 'contest-balloons', params: { key } }"
            class="inline-flex min-h-11 items-center rounded-pill border border-line px-4 font-semibold"
            >{{ $t('balloons.back') }}</RouterLink
          >
          <button
            type="button"
            class="inline-flex min-h-11 items-center rounded-pill bg-gradient-accent px-5 font-semibold text-on-accent"
            @click="printSheet"
          >
            {{ $t('balloons.print') }}
          </button>
        </div>
      </header>
      <QueryState :loading="isPending" :error="error" @retry="refetch()">
        <template #skeleton>
          <div class="flex flex-col gap-2">
            <SkeletonBlock
              v-for="index in PRINT_BATCH_SIZE"
              :key="index"
              data-skeleton-region="print-row"
              class="h-14 w-full"
            />
          </div>
        </template>
        <EmptyState
          v-if="queue && queue.items.length === 0"
          compact
          :kind="EXTRAS_BITS.printEmpty"
          >{{ $t('balloons.empty.pending') }}</EmptyState
        >
        <ol v-else-if="queue" class="m-0 flex list-none flex-col p-0">
          <li
            v-for="(item, index) in queue.items"
            :key="balloonRowId(item)"
            data-testid="print-row"
            class="flex min-h-14 items-center gap-4 border-b border-line py-2 text-xl"
          >
            <span class="w-8 text-right font-mono text-muted">{{ index + 1 }}</span>
            <span
              :class="[
                'inline-flex size-11 items-center justify-center rounded-full border font-display font-bold',
                swatchClassOf(item.problemLabel),
              ]"
              >{{ item.problemLabel }}</span
            >
            <span
              class="min-w-0 flex-1 truncate font-semibold"
              :class="ratingTextClass(item.team.rating)"
              >{{ item.team.username }}</span
            >
            <span class="font-mono tabular-nums">{{ solvedAtText(item.solvedAt) }}</span>
            <span v-if="item.isFirst" class="text-base font-semibold">{{
              $t('balloons.first')
            }}</span>
          </li>
        </ol>
      </QueryState>
    </template>
  </div>
</template>
