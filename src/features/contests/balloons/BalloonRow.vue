<script setup lang="ts">
import { Star } from 'lucide-vue-next';
import type { Balloon } from '@/api/types/contest-ops';
import { ratingTextClass } from '@/lib/tier-classes';
import { formatClock } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { isDelivered, solvedAtText, swatchClassOf } from './balloon-queue';

defineProps<{ balloon: Balloon; isBusy: boolean }>();
const emit = defineEmits<{ toggle: [] }>();
const locale = useLocaleStore();
</script>

<template>
  <li
    data-testid="balloon-row"
    class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2 border-t border-line px-4 py-3 first:border-t-0 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
  >
    <span
      :data-swatch="balloon.problemLabel"
      :class="[
        'inline-flex size-11 items-center justify-center rounded-full border font-display text-lg font-bold',
        swatchClassOf(balloon.problemLabel),
      ]"
      >{{ balloon.problemLabel }}</span
    >
    <div class="min-w-0">
      <p class="truncate font-semibold" :class="ratingTextClass(balloon.team.rating)">
        {{ balloon.team.username }}
      </p>
      <p class="text-sm text-muted">
        {{ balloon.problemCode }} ·
        <span class="font-mono tabular-nums">{{ solvedAtText(balloon.solvedAt) }}</span>
        <template v-if="isDelivered(balloon) && balloon.deliveredAt">
          ·
          {{
            $t('balloons.deliveredBy', {
              name: balloon.deliveredBy ?? '—',
              time: formatClock(balloon.deliveredAt, locale.locale),
            })
          }}
        </template>
      </p>
    </div>
    <span
      v-if="balloon.isFirst"
      data-testid="first-solve"
      class="inline-flex items-center gap-1 rounded-pill bg-first-solve px-2.5 py-1 text-sm font-semibold text-first-solve-text"
    >
      <Star class="size-4" aria-hidden="true" />{{ $t('balloons.first') }}
    </span>
    <span v-else class="hidden sm:block" />
    <button
      type="button"
      :aria-busy="isBusy || undefined"
      :class="[
        'col-span-2 inline-flex min-h-11 items-center justify-center rounded-pill px-5 font-semibold sm:col-span-1',
        isDelivered(balloon)
          ? 'border border-line hover:bg-surface-hover'
          : 'bg-gradient-accent text-on-accent',
      ]"
      @click="emit('toggle')"
    >
      {{ isDelivered(balloon) ? $t('balloons.undo') : $t('balloons.deliver')
      }}<span class="sr-only">
        {{
          $t('balloons.rowName', { label: balloon.problemLabel, team: balloon.team.username })
        }}</span
      >
    </button>
  </li>
</template>
