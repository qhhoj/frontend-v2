<script setup lang="ts">
import { computed } from 'vue';
import type { ContestDetail } from '@/api/types/contests';
import GlassCard from '@/components/GlassCard.vue';
import UserName from '@/components/UserName.vue';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { phaseAt, spanMessage } from '@/lib/contest-time';
import { formatClock, formatNumber, formatShortDate, formatWeekdayDate } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import ContestChips from './ContestChips.vue';
import { useContestTagsQuery } from './contest-extras.queries';
import ContestCountdown from './ContestCountdown.vue';
import ContestTimeBar from './ContestTimeBar.vue';
import PhasePill from './PhasePill.vue';

const props = defineProps<{ contest: ContestDetail }>();
/** The header colours its tags: read the catalogue only when the contest has tags. */
useContestTagsQuery(() => props.contest.tags.length > 0);
const emit = defineEmits<{ elapsed: [] }>();
const locale = useLocaleStore();
/** One clock for the card: the pill, the bar and the countdown switch on the same second. */
const now = useNow();
const phase = computed(() => phaseAt(props.contest, now.value));
const startMs = computed(() => Date.parse(props.contest.startTime));
const lengthSpan = computed(() =>
  spanMessage((Date.parse(props.contest.endTime) - startMs.value) / 1000),
);
const elapsedSpan = computed(() =>
  phase.value === 'running' ? spanMessage((now.value - startMs.value) / 1000) : null,
);
const phoneLine = computed(
  () =>
    `${props.contest.key} · ${formatClock(props.contest.startTime, locale.locale)}–${formatClock(props.contest.endTime, locale.locale)} · ${formatShortDate(props.contest.startTime, locale.locale)}`,
);
</script>

<template>
  <GlassCard
    data-testid="contest-header"
    class="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] md:p-6"
  >
    <div class="flex min-w-0 flex-col gap-3">
      <div class="flex flex-wrap items-center gap-1.5">
        <PhasePill :phase="phase" />
        <ContestChips :contest="contest" with-tags />
      </div>
      <div>
        <h1 class="font-display text-2xl leading-tight font-bold tracking-tight md:text-4xl">
          {{ contest.name }}
        </h1>
        <p class="font-mono text-[12px] text-muted md:hidden">{{ phoneLine }}</p>
        <p v-if="contest.summary" class="mt-1 hidden text-muted md:block">
          {{ contest.summary }}
        </p>
        <p class="mt-1 hidden text-sm text-muted md:block">
          <template v-if="contest.authors.length">
            {{ $t('contests.detail.authors') }}
            <template v-for="(author, index) in contest.authors" :key="author.id"
              >{{ index ? ', ' : ''
              }}<span class="inline-flex items-center gap-1.5 align-middle"
                ><UserAvatar :username="author.username" :size="24" /><UserName
                  :username="author.username"
                  :rating="author.rating" /></span
            ></template>
            ·
          </template>
          {{
            $t(
              'contests.participants',
              { count: formatNumber(contest.userCount, locale.locale) },
              contest.userCount,
            )
          }}
        </p>
      </div>
      <ContestTimeBar :contest="contest" :now="now" />
      <p class="hidden text-sm text-muted md:block">
        {{ formatWeekdayDate(contest.startTime, locale.locale) }} ·
        {{ $t(lengthSpan.key, lengthSpan.params, lengthSpan.count ?? 1) }}
        <template v-if="elapsedSpan">
          ·
          {{
            $t('contests.detail.elapsed', {
              span: $t(elapsedSpan.key, elapsedSpan.params, elapsedSpan.count ?? 1),
            })
          }}
        </template>
      </p>
    </div>
    <div class="flex flex-col gap-4">
      <ContestCountdown :contest="contest" @elapsed="emit('elapsed')" />
      <slot name="actions" />
    </div>
  </GlassCard>
</template>
