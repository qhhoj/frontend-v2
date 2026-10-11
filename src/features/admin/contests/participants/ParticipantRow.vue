<script setup lang="ts">
import { computed } from 'vue';
import { ChevronDown } from 'lucide-vue-next';
import type { Participation } from '@/api/types/contest-editing';
import { translate } from '@/i18n';
import { formatDateTime, formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminUserLabel from '../../ui/AdminUserLabel.vue';
import ParticipationDisqualify from './ParticipationDisqualify.vue';
import ParticipationRowActions from './ParticipationRowActions.vue';
import { formatPenalty, participationKindKey, rulesAcceptanceText } from './participations';

/**
 * One participation and, when expanded, its detail row: every field (the narrow layout hides most columns) and the editor
 * actions. The disclosure button names the row it opens.
 */
const props = defineProps<{
  contestKey: string;
  participation: Participation;
  isExpanded: boolean;
}>();
const emit = defineEmits<{ toggle: [] }>();
const locale = useLocaleStore();
const kindText = computed(() => {
  const kind = participationKindKey(props.participation.virtual);
  return translate(kind.key, kind.params ?? {});
});
const detailId = computed(() => `participation-detail-${props.participation.id}`);
const facts = computed(() => {
  const row = props.participation;
  return [
    [translate('admin.contests.participants.columns.kind'), kindText.value],
    [
      translate('admin.contests.participants.columns.score'),
      formatNumber(row.score, locale.locale),
    ],
    [
      translate('admin.contests.participants.columns.penalty'),
      formatPenalty(row.cumtime, locale.locale),
    ],
    [
      translate('admin.contestOps.participants.tiebreaker'),
      formatNumber(row.tiebreaker, locale.locale),
    ],
    [
      translate('admin.contests.participants.columns.start'),
      formatDateTime(row.realStart, locale.locale),
    ],
    [translate('admin.contestOps.participants.end'), formatDateTime(row.endTime, locale.locale)],
    [translate('admin.contestRules.column'), rulesAcceptanceText(row, locale.locale)],
  ] as const;
});
</script>

<template>
  <tr class="border-t border-line align-middle">
    <td class="px-2 py-3">
      <AdminUserLabel
        :username="participation.user.username"
        :rating="participation.user.rating"
        :size="24"
      />
      <p class="mt-1 text-xs text-muted md:hidden">
        {{ kindText }} · {{ formatNumber(participation.score, locale.locale) }}
      </p>
    </td>
    <td class="hidden px-2 py-3 md:table-cell">{{ kindText }}</td>
    <td class="hidden px-2 py-3 text-right tabular-nums md:table-cell">
      {{ formatNumber(participation.score, locale.locale) }}
    </td>
    <td class="hidden px-2 py-3 text-right tabular-nums md:table-cell">
      {{ formatPenalty(participation.cumtime, locale.locale) }}
    </td>
    <td class="hidden px-2 py-3 text-right tabular-nums lg:table-cell">
      {{ formatNumber(participation.tiebreaker, locale.locale) }}
    </td>
    <td class="hidden px-2 py-3 lg:table-cell">
      {{ formatDateTime(participation.realStart, locale.locale) }}
    </td>
    <td :id="`participation-status-${participation.id}`" tabindex="-1" class="px-2 py-3">
      <span
        class="inline-flex whitespace-nowrap rounded-pill border px-2.5 py-0.5 text-xs font-semibold"
        :class="
          participation.isDisqualified
            ? 'border-negative text-negative'
            : 'border-positive text-positive'
        "
      >
        {{
          participation.isDisqualified
            ? $t('admin.contests.participants.disqualified')
            : $t('admin.contests.participants.valid')
        }}
      </span>
    </td>
    <td class="px-2 py-3 text-right">
      <button
        type="button"
        class="inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded-pill px-3 font-semibold hover:bg-surface-hover"
        :aria-expanded="isExpanded"
        :aria-controls="detailId"
        @click="emit('toggle')"
      >
        {{ $t('admin.contestOps.participants.manage') }}
        <span class="sr-only">{{ participation.user.username }}</span>
        <ChevronDown
          aria-hidden="true"
          class="size-4 transition-transform"
          :class="isExpanded ? 'rotate-180' : ''"
        />
      </button>
    </td>
  </tr>
  <tr v-if="isExpanded" :id="detailId" class="bg-surface-hover">
    <td colspan="8" class="px-3 py-4">
      <dl class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
        <div v-for="[term, value] in facts" :key="term" class="flex flex-col">
          <dt class="text-xs text-muted">{{ term }}</dt>
          <dd class="tabular-nums">{{ value }}</dd>
        </div>
      </dl>
      <div class="mt-4 flex flex-wrap items-start gap-1.5">
        <ParticipationDisqualify :contest-key="contestKey" :participation="participation" />
        <ParticipationRowActions :contest-key="contestKey" :participation="participation" />
      </div>
    </td>
  </tr>
</template>
