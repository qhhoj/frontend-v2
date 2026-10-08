<script setup lang="ts">
import { computed } from 'vue';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import { formatDateTime, formatNumber } from '@/lib/format';
import { translate } from '@/i18n';
import { useLocaleStore } from '@/stores/locale.store';
import type { SimilarityRun } from '@/api/types/similarity';
import { shortId } from '../ui/short-id';
import { runStatusText } from './run-text';
import SimilarityGroupsTable from './SimilarityGroupsTable.vue';
import { totalPairs, truncatedGroups } from './similarity-runs';

const props = defineProps<{ run: SimilarityRun }>();
const locale = useLocaleStore();
const pairs = computed(() => totalPairs(props.run));
const hasFailedGroup = computed(() => props.run.groups.some((group) => group.failed));
const count = (value: number) => formatNumber(value, locale.locale);
const instantOrNotYet = (instant: string | null) =>
  instant ? formatDateTime(instant, locale.locale) : translate('admin.similarity.summary.notYet');
</script>

<template>
  <section data-testid="run-summary">
    <SettingsCard :title="$t('admin.similarity.summary.heading', { id: shortId(run.id) })">
      <dl class="grid gap-4 sm:grid-cols-2">
        <div>
          <dt class="text-sm text-muted">{{ $t('admin.similarity.runs.columns.status') }}</dt>
          <dd class="font-semibold">{{ runStatusText(run) }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">{{ $t('admin.similarity.summary.startedAt') }}</dt>
          <dd class="font-semibold">{{ instantOrNotYet(run.startedAt) }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">{{ $t('admin.similarity.summary.finishedAt') }}</dt>
          <dd class="font-semibold">{{ instantOrNotYet(run.finishedAt) }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">{{ $t('admin.similarity.summary.threshold') }}</dt>
          <dd class="font-semibold">{{ run.limits.minPercent }}%</dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-sm text-muted">{{ $t('admin.similarity.summary.limits') }}</dt>
          <dd class="font-semibold">
            {{
              $t('admin.similarity.summary.limitsValue', {
                pairs: count(run.limits.maxPairs),
                submissions: count(run.limits.maxSubmissions),
              })
            }}
          </dd>
        </div>
      </dl>
      <SettingsNotice
        v-for="group in truncatedGroups(run)"
        :key="group.problemId + group.language"
        tone="warning"
      >
        {{
          $t('admin.similarity.summary.truncated', {
            code: group.problemCode,
            language: group.language,
            count: count(group.submissionCount),
            compared: count(group.comparedCount),
          })
        }}
      </SettingsNotice>
      <SettingsNotice v-if="hasFailedGroup" tone="warning">
        {{ $t('admin.similarity.summary.someFailed') }}
      </SettingsNotice>
      <SimilarityGroupsTable :groups="run.groups" />
      <div v-if="run.unsupported.length" class="flex flex-col gap-2">
        <h3 class="text-sm font-semibold">{{ $t('admin.similarity.summary.unsupported') }}</h3>
        <ul class="flex flex-wrap gap-2">
          <li
            v-for="entry in run.unsupported"
            :key="entry.language"
            class="rounded-pill bg-surface-solid px-3 py-1 text-sm"
          >
            {{
              $t('admin.similarity.summary.unsupportedChip', {
                language: entry.language,
                count: count(entry.submissionCount),
              })
            }}
          </li>
        </ul>
      </div>
      <RouterLink
        v-if="pairs !== null"
        :to="{ name: 'admin-similarityPairs', params: { runId: run.id } }"
        class="inline-flex min-h-11 items-center font-semibold underline"
      >
        {{ $t('admin.similarity.summary.viewPairs', { count: count(pairs) }) }}
      </RouterLink>
    </SettingsCard>
  </section>
</template>
