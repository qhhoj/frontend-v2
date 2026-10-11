<script setup lang="ts">
import { computed } from 'vue';
import AdminEditLink from '@/features/admin/edit-link/AdminEditLink.vue';
import { judgesEditTarget } from '@/features/admin/edit-link/admin-edit-targets';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useSubmissionStatsQuery } from '@/features/submissions/submissions.queries';
import { useSessionStore } from '@/stores/session.store';
import { useNow } from '@/lib/use-now';
import ExternalJudgeStatusCard from '@/features/external-judge/ExternalJudgeStatusCard.vue';
import JudgeCard from './JudgeCard.vue';
import LanguageList from './LanguageList.vue';
import RuntimeTiles from './RuntimeTiles.vue';
import { runtimeTotals } from './runtimes-model';
import { useRuntimesQuery } from './runtimes.queries';

/** Public: is the judging alive, and which compiler version runs each language (variant A: cards, then an expanding table). */
const { data, isPending, error, refetch } = useRuntimesQuery();
const stats = useSubmissionStatsQuery();
const session = useSessionStore();
const now = useNow(60_000);
const totals = computed(() => runtimeTotals(data.value?.judges ?? []));
</script>

<template>
  <div class="page-column">
    <header class="flex items-start gap-3">
      <div class="min-w-0 flex-1">
        <h1 class="page-title">{{ $t('runtimes.title') }}</h1>
        <p class="text-muted">{{ $t('runtimes.lead') }}</p>
      </div>
      <AdminEditLink :to="judgesEditTarget(session.user)" />
    </header>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <SkeletonBlock class="h-20 w-full" />
        <div class="grid gap-4 md:grid-cols-3">
          <SkeletonBlock v-for="index in 3" :key="index" class="h-44 w-full" />
        </div>
        <SkeletonBlock class="h-96 w-full" />
      </template>
      <template v-if="data">
        <RuntimeTiles :totals="totals" :queue-length="stats.data.value?.queueLength ?? null" />
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <JudgeCard v-for="judge in data.judges" :key="judge.name" :judge="judge" :now="now" />
        </div>
        <LanguageList :languages="data.languages" :judges="data.judges" />
      </template>
      <ExternalJudgeStatusCard />
    </QueryState>
  </div>
</template>
