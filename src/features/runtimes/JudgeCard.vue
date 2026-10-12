<script setup lang="ts">
import { computed } from 'vue';
import type { RuntimeJudge } from '@/api/types/runtimes';
import GlassCard from '@/components/GlassCard.vue';
import InlineBit from '@/components/InlineBit.vue';
import { uptimeSince } from './runtimes-model';

/** An offline judge is asleep, not broken: a sleeping Bit and plain words, never a warning colour. */
const props = defineProps<{ judge: RuntimeJudge; now: number }>();
const uptime = computed(() =>
  props.judge.startedAt ? uptimeSince(props.judge.startedAt, props.now) : null,
);
const loadPercent = computed(() =>
  props.judge.slots > 0
    ? Math.min(100, Math.round((props.judge.busy / props.judge.slots) * 100))
    : 0,
);
</script>

<template>
  <GlassCard
    as="article"
    :data-testid="`judge-card-${judge.name}`"
    class="flex flex-col gap-3 p-5"
    :class="{ 'opacity-80': !judge.online }"
  >
    <header class="flex items-center justify-between gap-2">
      <h3 class="font-display text-lg font-bold">{{ judge.name }}</h3>
      <span class="flex items-center gap-1.5 text-sm" :class="{ 'text-muted': !judge.online }">
        <span
          aria-hidden="true"
          class="size-2.5 rounded-full"
          :class="judge.online ? 'bg-verdict-ac' : 'bg-line-strong'"
        />
        <b>{{ judge.online ? $t('runtimes.online') : $t('runtimes.offline') }}</b>
      </span>
    </header>
    <template v-if="judge.online">
      <div class="flex items-center justify-between gap-3 text-sm">
        <span>{{ $t('runtimes.load', { busy: judge.busy, slots: judge.slots }) }}</span>
        <span aria-hidden="true" class="flex gap-1">
          <i
            v-for="slot in judge.slots"
            :key="slot"
            class="size-2.5 rounded-[2px]"
            :class="slot <= judge.busy ? 'bg-accent' : 'bg-line-strong'"
          />
        </span>
      </div>
      <div
        role="progressbar"
        :aria-valuenow="loadPercent"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="$t('runtimes.loadLabel')"
        class="h-1.5 overflow-hidden rounded-pill bg-surface-strong"
      >
        <div class="h-full bg-accent" :style="{ width: `${loadPercent}%` }" />
      </div>
      <dl class="flex flex-col gap-1 text-sm">
        <div class="flex justify-between gap-3">
          <dt class="text-muted">{{ $t('runtimes.ping') }}</dt>
          <dd class="font-mono font-bold">
            {{ judge.pingMs === null ? '—' : `${judge.pingMs} ms` }}
          </dd>
        </div>
        <div v-if="uptime" class="flex justify-between gap-3">
          <dt class="text-muted">{{ $t('runtimes.uptime') }}</dt>
          <dd class="font-bold">{{ $t(`runtimes.uptimeUnit.${uptime.unit}`, uptime.count) }}</dd>
        </div>
      </dl>
    </template>
    <p v-else class="flex items-center gap-3 text-sm text-muted">
      <InlineBit kind="asleep" />{{ $t('runtimes.asleep') }}
    </p>
  </GlassCard>
</template>
