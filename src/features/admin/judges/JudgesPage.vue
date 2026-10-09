<script setup lang="ts">
import { computed, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminBit from '../shell/AdminBit.vue';
import { ADMIN_PRIMARY_CLASS } from '../ui/classes';
import JudgeKeyDialog from './JudgeKeyDialog.vue';
import JudgeRow from './JudgeRow.vue';
import JudgeStats from './JudgeStats.vue';
import { judgeStats } from './judge-stats';
import { useJudgesQuery } from './judges.queries';

const { data, isPending, error, refetch } = useJudgesQuery();
const judges = computed(() => data.value ?? []);
const stats = computed(() => judgeStats(judges.value));
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
  <div class="flex flex-col gap-5 px-4 py-6 sm:px-8">
    <AdminPageHeader
      :crumbs="[
        { label: $t('admin.judges.crumbs.group') },
        { label: $t('admin.judges.crumbs.judges') },
      ]"
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
      <JudgeStats :stats="stats" />
      <p class="text-sm text-muted">{{ $t('admin.judges.notes.load') }}</p>
      <p class="text-sm text-muted">{{ $t('admin.judges.notes.rotate') }}</p>
      <ul v-if="judges.length > 0" class="flex flex-col gap-3">
        <li v-for="judge in judges" :key="judge.name">
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
