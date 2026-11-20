<script setup lang="ts">
import { Plus } from 'lucide-vue-next';
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import type { ProblemListItem } from '@/api/types/problems';
import EmptyState from '@/components/EmptyState.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import Chip from '@/components/ui/Chip.vue';
import PageSection from '@/components/ui/PageSection.vue';
import AppButton from '@/components/ui/AppButton.vue';
import StretchedLink from '@/components/ui/StretchedLink.vue';
import { translate } from '@/i18n';
import { GAP_ROUTE, setupGapsOf } from '@/features/admin/search/problem-setup-marks';
import { useMyProblemsQuery } from './home.queries';

/**
 * "Bài của tôi" (staff only): the problems the viewer may edit, unfinished first, one row each, a link as a whole, with its setup state
 * ("Chưa xong" and what it still lacks, the admin problem list's own texts; a click goes to the tab that fixes the first gap).
 * The header links to the list filtered to the viewer's own problems; the foot has "+ Tạo bài".
 */
const props = defineProps<{ username: string }>();
const { data: problems, isPending, error, refetch } = useMyProblemsQuery(true);
const mine = computed(() => problems.value ?? []);
const listLink = computed<RouteLocationRaw>(() => ({
  name: 'admin-problems',
  query: { author: props.username },
}));
const gapsOf = (problem: ProblemListItem) => setupGapsOf(problem.setup) ?? [];
const isUnfinished = (problem: ProblemListItem) => gapsOf(problem).length > 0;
const gapText = (problem: ProblemListItem) =>
  translate('admin.problemList.setup.missing', {
    gaps: gapsOf(problem)
      .map((gap) => translate(`admin.problemList.setup.gaps.${gap}`))
      .join(', '),
  });
/** An unfinished row opens the tab that fixes its first gap; a finished one opens the editor. */
const targetOf = (problem: ProblemListItem): RouteLocationRaw => ({
  name: isUnfinished(problem) ? GAP_ROUTE[gapsOf(problem)[0]!] : 'admin-problemGeneral',
  params: { code: problem.code },
});
const CREATE = { name: 'admin-problemNew' };
</script>

<template>
  <PageSection
    data-testid="my-problems"
    :title="$t('home.mine.title')"
    :see-all="{ to: listLink, label: $t('common.viewAll') }"
  >
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <ul class="flex flex-col divide-y divide-line">
          <li v-for="row in 3" :key="row" class="flex min-h-(--qh-row) items-center gap-3 px-2">
            <span class="min-w-0 flex-1"><SkeletonBlock text class="w-2/3" /></span>
            <SkeletonBlock text class="w-16" />
          </li>
        </ul>
      </template>
      <EmptyState v-if="!mine.length" inline>
        {{ $t('home.mine.empty') }}
        <template #action>
          <AppButton tone="link" class="text-meta" :to="CREATE">{{
            $t('home.mine.create')
          }}</AppButton>
        </template>
      </EmptyState>
      <template v-else>
        <ul class="flex flex-col divide-y divide-line">
          <li
            v-for="problem in mine"
            :key="problem.code"
            data-testid="my-problem-row"
            class="box-link flex min-h-(--qh-row) items-center gap-3 px-2 touch:min-h-13"
          >
            <StretchedLink
              :to="targetOf(problem)"
              class="min-w-0 flex-1 truncate font-medium text-content"
              >{{ problem.name }}</StretchedLink
            >
            <template v-if="isUnfinished(problem)">
              <span class="shrink-0 text-small text-muted max-sm:hidden">{{
                gapText(problem)
              }}</span>
              <Chip tone="attention" size="sm" :title="gapText(problem)">{{
                $t('admin.problemList.setup.unfinished')
              }}</Chip>
            </template>
          </li>
        </ul>
        <AppButton tone="link" :to="CREATE" class="text-meta mt-1 gap-1"
          ><Plus aria-hidden="true" class="size-4" />{{ $t('home.mine.create') }}</AppButton
        >
      </template>
    </QueryState>
  </PageSection>
</template>
