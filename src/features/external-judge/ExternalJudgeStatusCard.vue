<script setup lang="ts">
import { computed } from 'vue';
import Card from '@/components/ui/Card.vue';
import Chip from '@/components/ui/Chip.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { useExternalJudgeStatusQuery } from './external-judge.queries';

/** Whether the external judge is set up and reachable, and the OJs it serves. Mounted by the runtimes page. */
const query = useExternalJudgeStatusQuery();
const locale = useLocaleStore();
const session = useSessionStore();
/** Visitors have no use for "not set up" (or a card that may vanish): they see it only once the judge is known to be on; staff always. */
const isHidden = computed(() => !session.isStaff && query.data.value?.enabled !== true);
</script>

<template>
  <Card
    v-if="!isHidden"
    padding="md"
    :title="$t('externalJudge.status.title')"
    data-testid="external-judge-status"
  >
    <QueryState
      :loading="query.isPending.value"
      :error="query.error.value"
      @retry="() => void query.refetch()"
    >
      <template #skeleton>
        <SkeletonBlock text class="w-40" />
        <SkeletonBlock text class="mt-2 w-64" />
      </template>
      <template v-if="query.data.value">
        <p v-if="!query.data.value.enabled" class="text-muted">
          {{ $t('externalJudge.status.disabled') }}
        </p>
        <template v-else>
          <Chip :tone="query.data.value.reachable ? 'success' : 'danger'" size="md" dot>
            {{
              query.data.value.reachable
                ? $t('externalJudge.status.reachable')
                : $t('externalJudge.status.unreachable')
            }}
          </Chip>
          <ul v-if="query.data.value.ojs.length > 0" class="mt-3 flex flex-wrap gap-2">
            <li v-for="oj in query.data.value.ojs" :key="oj">
              <Chip size="md">{{ oj }}</Chip>
            </li>
          </ul>
          <p v-if="query.data.value.checkedAt" class="mt-3 text-caption leading-4 text-muted">
            {{
              $t('externalJudge.status.checkedAt', {
                time: formatDate(query.data.value.checkedAt, 'datetime', locale.locale),
              })
            }}
          </p>
        </template>
      </template>
    </QueryState>
  </Card>
</template>
