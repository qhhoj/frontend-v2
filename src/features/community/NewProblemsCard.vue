<script setup lang="ts">
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import PageSection from '@/components/ui/PageSection.vue';
import StretchedLink from '@/components/ui/StretchedLink.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useHomeQuery } from './community.queries';

/** The home's newest problems: the name (two lines on phones, the code under it), the code (wide screens) and the points as a number under the "Điểm" label. */
const props = defineProps<{ limit: number }>();
const locale = useLocaleStore();
const { data: home, isPending, error, refetch } = useHomeQuery();
const problems = computed(() => (home.value?.newProblems ?? []).slice(0, props.limit));
</script>

<template>
  <PageSection
    data-testid="new-problems"
    :title="$t('blog.newProblems')"
    :see-all="{ to: { name: 'problems' }, label: $t('common.viewAll') }"
  >
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <div class="flex flex-col gap-3">
          <div v-for="row in 4" :key="row" class="flex flex-col gap-1.5">
            <SkeletonBlock pill class="h-4 w-3/4" />
            <SkeletonBlock pill class="h-3 w-1/3" />
          </div>
        </div>
      </template>
      <p class="flex justify-end text-caption text-muted">
        <span class="w-12 text-right">{{ $t('home.points') }}</span>
      </p>
      <ul class="flex flex-col divide-y divide-line">
        <li
          v-for="problem in problems"
          :key="problem.code"
          class="box-link flex items-baseline gap-3 py-1.5 first:pt-0 last:pb-0"
        >
          <div class="min-w-0 flex-1">
            <StretchedLink
              :to="{ name: 'problem', params: { code: problem.code } }"
              class="font-semibold max-sm:line-clamp-2 sm:block sm:truncate"
              >{{ problem.name }}</StretchedLink
            >
            <span class="block text-caption text-muted sm:hidden">{{ problem.code }}</span>
          </div>
          <span class="hidden shrink-0 text-caption text-muted sm:inline">{{ problem.code }}</span>
          <span class="w-12 shrink-0 text-right font-mono text-sm tabular-nums text-muted">
            {{ formatNumber(problem.points, locale.locale) }}
          </span>
        </li>
      </ul>
    </QueryState>
  </PageSection>
</template>
