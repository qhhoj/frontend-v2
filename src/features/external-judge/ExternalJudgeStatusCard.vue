<script setup lang="ts">
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useExternalJudgeStatusQuery } from './external-judge.queries';

/** Whether the external judge is set up and reachable, and the OJs it serves. Mounted by the runtimes page. */
const query = useExternalJudgeStatusQuery();
const locale = useLocaleStore();
</script>

<template>
  <GlassCard class="rounded-panel p-5" data-testid="external-judge-status">
    <h2 class="font-display text-lg font-bold">{{ $t('externalJudge.status.title') }}</h2>
    <QueryState
      :loading="query.isPending.value"
      :error="query.error.value"
      @retry="() => void query.refetch()"
    >
      <template #skeleton>
        <SkeletonBlock text class="mt-3 w-40" />
        <SkeletonBlock text class="mt-2 w-64" />
      </template>
      <template v-if="query.data.value">
        <p v-if="!query.data.value.enabled" class="mt-2 text-muted">
          {{ $t('externalJudge.status.disabled') }}
        </p>
        <template v-else>
          <p
            class="mt-2 font-semibold"
            :class="query.data.value.reachable ? 'text-positive' : 'text-negative'"
          >
            {{
              query.data.value.reachable
                ? $t('externalJudge.status.reachable')
                : $t('externalJudge.status.unreachable')
            }}
          </p>
          <ul v-if="query.data.value.ojs.length > 0" class="mt-3 flex flex-wrap gap-2">
            <li
              v-for="oj in query.data.value.ojs"
              :key="oj"
              class="rounded-pill border border-line px-3 py-1 text-sm"
            >
              {{ oj }}
            </li>
          </ul>
          <p v-if="query.data.value.checkedAt" class="mt-3 text-xs text-muted">
            {{
              $t('externalJudge.status.checkedAt', {
                time: formatDateTime(query.data.value.checkedAt, locale.locale),
              })
            }}
          </p>
        </template>
      </template>
    </QueryState>
  </GlassCard>
</template>
