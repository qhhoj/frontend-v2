<script setup lang="ts">
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminBit from '../shell/AdminBit.vue';
import { ADMIN_PRIMARY_CLASS } from '../ui/classes';
import JudgeRow from './JudgeRow.vue';
import JudgeStats from './JudgeStats.vue';
import { judgeStats } from './judge-stats';
import { useJudgesQuery } from './judges.queries';

const { data, isPending, error, refetch } = useJudgesQuery();
const judges = computed(() => data.value ?? []);
const stats = computed(() => judgeStats(judges.value));
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
        <div class="flex flex-col gap-4">
          <SkeletonBlock class="h-24 w-full" />
          <SkeletonBlock v-for="index in 5" :key="index" class="h-32 w-full" />
        </div>
      </template>
      <JudgeStats :stats="stats" />
      <p class="text-sm text-muted">{{ $t('admin.judges.notes.load') }}</p>
      <p class="text-sm text-muted">{{ $t('admin.judges.notes.rotate') }}</p>
      <ul v-if="judges.length > 0" class="flex flex-col gap-3">
        <li v-for="judge in judges" :key="judge.name">
          <JudgeRow :judge="judge" />
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
  </div>
</template>
