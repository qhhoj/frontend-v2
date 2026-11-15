<script setup lang="ts">
import { computed } from 'vue';
import type { ProblemListItem } from '@/api/types/problems';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';
import StatGrid from '@/components/ui/StatGrid.vue';
import { translate } from '@/i18n';
import {
  formatMemoryLimit,
  formatNumber,
  formatProblemPoints,
  formatTimeLimit,
} from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import KeyHint from './KeyHint.vue';
import ProblemPeekLastSubmission from './ProblemPeekLastSubmission.vue';
import { UNCATEGORIZED_TYPE_NAME, problemTypeLabel } from './problem-type-label';
import { useProblemQuery } from './problems.queries';

/**
 * The peek pane beside the problem list: one problem without leaving the list. The head (code, name, types, crowd numbers)
 * comes from the list row at once; the limits and the summary from the problem page's own query, so opening the problem
 * after a peek shows it without a wait. Then the viewer's last verdict and "Mở bài".
 */
const props = defineProps<{ problem: ProblemListItem }>();
const locale = useLocaleStore();
const session = useSessionStore();
const code = computed(() => props.problem.code);
const lang = computed(() => locale.locale);
const { data: detail, isPending, error, refetch } = useProblemQuery(code, lang);
/** A kept answer for another problem is never shown under this one's head. */
const shown = computed(() => (detail.value?.code === code.value ? detail.value : undefined));

const types = computed(() =>
  props.problem.types
    .filter((type) => type.name !== UNCATEGORIZED_TYPE_NAME)
    .map((type) => problemTypeLabel(type)),
);
const facts = computed(() =>
  shown.value
    ? [
        { label: translate('problem.limits.time'), value: formatTimeLimit(shown.value.timeLimit) },
        {
          label: translate('problem.limits.memory'),
          value: formatMemoryLimit(shown.value.memoryLimit),
        },
        {
          label: translate('problem.limits.points'),
          value: formatProblemPoints(props.problem.points, props.problem.partial, locale.locale),
        },
      ]
    : [],
);
const crowd = computed(() =>
  translate('problems.peek.crowd', {
    rate: formatNumber(props.problem.acRate, locale.locale, 1),
    count: formatNumber(props.problem.userCount, locale.locale),
  }),
);
const to = computed(() => ({ name: 'problem', params: { code: code.value } }));
</script>

<template>
  <div class="flex flex-col gap-4" data-testid="problem-peek">
    <header class="flex flex-col gap-1.5">
      <p class="font-mono text-meta text-muted">{{ problem.code }}</p>
      <h2 class="text-subtitle leading-6 font-semibold [overflow-wrap:anywhere]">
        {{ problem.name }}
      </h2>
      <ul v-if="types.length" class="m-0 flex list-none flex-wrap gap-1 p-0">
        <li v-for="name in types" :key="name">
          <Chip size="sm">{{ name }}</Chip>
        </li>
      </ul>
    </header>
    <QueryState :loading="isPending && !shown" :error="shown ? null : error" @retry="refetch()">
      <template #skeleton><SkeletonBlock class="h-14" /></template>
      <StatGrid :items="facts" :cols="3" />
    </QueryState>
    <p class="text-meta text-secondary">
      {{ crowd }}
      <template v-if="problem.partial"> · {{ $t('problems.partialHint') }}</template>
    </p>
    <p v-if="shown?.summary" class="line-clamp-6 text-sm text-secondary">{{ shown.summary }}</p>
    <ProblemPeekLastSubmission
      v-if="session.user"
      :code="problem.code"
      :username="session.user.username"
    />
    <div class="flex items-center gap-2">
      <AppButton :to="to">{{ $t('problems.peek.open') }}<KeyHint keys="Enter" /></AppButton>
    </div>
  </div>
</template>
