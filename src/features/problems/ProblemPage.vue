<script setup lang="ts">
import { computed, toRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '@/api/client';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import UserName from '@/components/UserName.vue';
import NotFoundPage from '@/features/not-found/NotFoundPage.vue';
import { useLocaleStore } from '@/stores/locale.store';
import ProblemHeader from './ProblemHeader.vue';
import ProblemHeaderSkeleton from './ProblemHeaderSkeleton.vue';
import ProblemTabs from './ProblemTabs.vue';
import StatementBody from './StatementBody.vue';
import StatementSkeleton from './StatementSkeleton.vue';
import { useProblemQuery } from './problems.queries';

const DEFAULT_TAB = 'statement';
const SKELETON_TAB_COUNT = 3;
const route = useRoute();
const router = useRouter();
const locale = useLocaleStore();
const code = computed(() => String(route.params.code));
const { data: problem, isPending, error, refetch } = useProblemQuery(code, toRef(locale, 'locale'));

const isNotFound = computed(
  () => error.value instanceof ApiError && error.value.code === 'not_found',
);

/** Page tabs; 8e adds `discussion` here. `submissions` is filled by the submissions tab. */
const tabs = computed(() => [
  { id: DEFAULT_TAB, labelKey: 'problem.tabs.statement' },
  ...(problem.value?.hasEditorial ? [{ id: 'editorial', labelKey: 'problem.tabs.editorial' }] : []),
  { id: 'submissions', labelKey: 'problem.tabs.submissions' },
]);
const requestedTab = computed(() => (typeof route.query.tab === 'string' ? route.query.tab : null));
const tab = computed({
  get: () => tabs.value.find((candidate) => candidate.id === requestedTab.value)?.id ?? DEFAULT_TAB,
  set: (id: string) =>
    void router.push({
      query: { ...route.query, tab: id === DEFAULT_TAB ? undefined : id },
    }),
});

// An unknown or unavailable ?tab= (an editorial that does not exist) is dropped once the detail is known.
watch(problem, (loaded) => {
  if (loaded && requestedTab.value !== null && tab.value !== requestedTab.value)
    void router.replace({ query: { ...route.query, tab: undefined } });
});
</script>

<template>
  <NotFoundPage v-if="isNotFound" />
  <div
    v-else
    class="mx-auto flex max-w-[960px] flex-col gap-5 px-4 py-6 sm:px-8"
    :style="{ paddingBottom: 'calc(1.5rem + var(--dock-height, 0px))' }"
  >
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <ProblemHeaderSkeleton />
        <div data-skeleton-region="tabs" class="flex flex-wrap gap-2">
          <SkeletonBlock v-for="index in SKELETON_TAB_COUNT" :key="index" pill class="h-11 w-24" />
        </div>
        <StatementSkeleton />
      </template>
      <template v-if="problem">
        <ProblemHeader :problem="problem"><template #actions /></ProblemHeader>
        <ProblemTabs v-model="tab" :tabs="tabs" :label="$t('problem.tabsLabel')" />
        <div
          :id="`problem-panel-${tab}`"
          role="tabpanel"
          :aria-labelledby="`problem-tab-${tab}`"
          tabindex="0"
        >
          <GlassCard
            v-if="tab === DEFAULT_TAB"
            as="div"
            data-testid="statement-card"
            class="rounded-panel p-6 text-[15px] sm:p-8"
          >
            <p v-if="!problem.translated" class="mb-4 text-sm text-muted">
              {{ $t('problem.untranslated') }}
            </p>
            <StatementBody :html="problem.descriptionHtml" />
            <p v-if="problem.authors.length" class="mt-6 text-sm text-muted">
              {{ $t('problem.authors') }}
              <template v-for="(author, index) in problem.authors" :key="author.id"
                ><template v-if="index">, </template><UserName :username="author.username"
              /></template>
            </p>
          </GlassCard>
        </div>
      </template>
    </QueryState>
  </div>
</template>
