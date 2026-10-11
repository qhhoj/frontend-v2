<script setup lang="ts">
import { computed, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminBit from '../shell/AdminBit.vue';
import { ADMIN_INPUT_CLASS, ADMIN_PRIMARY_CLASS } from '../ui/classes';
import JudgeKeyDialog from './JudgeKeyDialog.vue';
import JudgeQueueCard from './JudgeQueueCard.vue';
import JudgeRow from './JudgeRow.vue';
import JudgeStats from './JudgeStats.vue';
import { judgeStats, matchesJudge, sortJudges } from './judge-stats';
import type { JudgeListFilter } from './judge-stats';
import { JUDGE_SEARCH_ID, useJudgesQuery } from './judges.queries';
import { JUDGE_POLL_MS } from './queue.queries';

const { data, isPending, error, refetch } = useJudgesQuery({ pollMs: JUDGE_POLL_MS });
const judges = computed(() => data.value ?? []);
const stats = computed(() => judgeStats(judges.value));
const listFilter = ref<JudgeListFilter>({ status: null, search: '' });
const shown = computed(() =>
  sortJudges(judges.value).filter((judge) => matchesJudge(judge, listFilter.value)),
);
/**
 * The key shown once after a rotation. It lives here, outside QueryState, so a failed refetch cannot unmount it; it is dropped on
 * close, on route leave, and with this page.
 */
const revealed = ref<{ judgeName: string; authKey: string } | null>(null);
onBeforeRouteLeave(() => {
  revealed.value = null;
});
</script>

<template>
  <div class="flex flex-col gap-5">
    <AdminPageHeader
      :title="$t('admin.shell.screens.judges')"
      :lead="$t('admin.judges.index.lead')"
    >
      <template #actions>
        <RouterLink :to="{ name: 'admin-judgeNew' }" :class="ADMIN_PRIMARY_CLASS">
          {{ $t('admin.judges.index.addButton') }}
        </RouterLink>
      </template>
    </AdminPageHeader>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <div class="flex flex-col gap-5">
          <SkeletonBlock
            data-skeleton-region="judge-stats"
            class="h-[11.875rem] w-full sm:h-[7.625rem]"
          />
          <SkeletonBlock v-for="index in 2" :key="index" class="h-10 w-full sm:h-5" />
          <div class="flex flex-col gap-3">
            <SkeletonBlock
              v-for="index in 5"
              :key="index"
              data-skeleton-region="judge-row"
              class="h-[19.575rem] w-full sm:h-[13.625rem]"
            />
          </div>
        </div>
      </template>
      <JudgeQueueCard />
      <JudgeStats v-model:status="listFilter.status" :stats="stats" />
      <p class="text-sm text-muted">{{ $t('admin.judges.notes.load') }}</p>
      <p class="text-sm text-muted">{{ $t('admin.judges.notes.rotate') }}</p>
      <label v-if="judges.length > 0" class="flex max-w-md flex-col gap-1 text-sm font-semibold">
        {{ $t('admin.judges.index.search') }}
        <input
          :id="JUDGE_SEARCH_ID"
          v-model="listFilter.search"
          type="search"
          :class="ADMIN_INPUT_CLASS"
          :placeholder="$t('admin.judges.index.searchPlaceholder')"
        />
      </label>
      <p v-if="judges.length > 0 && shown.length === 0" class="text-sm text-muted">
        {{ $t('admin.judges.index.noMatch') }}
      </p>
      <ul v-if="judges.length > 0" class="flex flex-col gap-3">
        <li v-for="judge in shown" :key="judge.name">
          <JudgeRow
            :judge="judge"
            @rotated="(judgeName, authKey) => (revealed = { judgeName, authKey })"
          />
        </li>
      </ul>
      <section v-else class="glass flex flex-col items-center gap-3 rounded-panel p-6 text-center">
        <AdminBit placement="empty" />
        <p>{{ $t('admin.judges.index.empty') }}</p>
        <RouterLink :to="{ name: 'admin-judgeNew' }" :class="ADMIN_PRIMARY_CLASS">
          {{ $t('admin.judges.index.emptyAdd') }}
        </RouterLink>
      </section>
    </QueryState>
    <JudgeKeyDialog
      :visible="revealed !== null"
      :header="$t('admin.judges.key.rotatedTitle', { name: revealed?.judgeName ?? '' })"
      :auth-key="revealed?.authKey ?? ''"
      @close="revealed = null"
    />
  </div>
</template>
