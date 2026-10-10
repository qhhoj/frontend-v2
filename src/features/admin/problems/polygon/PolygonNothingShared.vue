<script setup lang="ts">
import BitMascot from '@/components/BitMascot.vue';
import GlassCard from '@/components/GlassCard.vue';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
import { ADMIN_BUTTON_CLASS, ADMIN_PRIMARY_CLASS } from '../../ui/classes';

/** The account can read no problem yet: what a setter does on Polygon, then refresh. */
defineProps<{ accountName: string; isRefreshing: boolean }>();
const emit = defineEmits<{ refresh: [] }>();
const STEPS = ['access', 'grant', 'package'] as const;
</script>

<template>
  <GlassCard class="flex flex-col items-center gap-4 px-5 py-10 text-center">
    <BitMascot
      :look="PLACEMENT_LOOKS.emptyList"
      :label="$t('bit.asleep')"
      closed-eyes
      class="[--bit-px:4px] sm:[--bit-px:5px]"
    />
    <h2 class="font-display text-xl font-bold">
      {{ $t('admin.polygonLink.nothingShared.title', { account: accountName }) }}
    </h2>
    <p class="max-w-xl text-sm text-muted">
      {{ $t('admin.polygonLink.nothingShared.body', { account: accountName }) }}
    </p>
    <ol class="grid max-w-3xl gap-3 text-left text-sm sm:grid-cols-3">
      <li v-for="(step, index) in STEPS" :key="step" class="flex items-start gap-3">
        <span
          aria-hidden="true"
          class="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-soft-text"
          >{{ index + 1 }}</span
        >
        <span>{{
          $t(`admin.polygonLink.nothingShared.steps.${step}`, { account: accountName })
        }}</span>
      </li>
    </ol>
    <div class="flex flex-wrap justify-center gap-2">
      <button
        type="button"
        :class="ADMIN_PRIMARY_CLASS"
        :aria-busy="isRefreshing || undefined"
        @click="emit('refresh')"
      >
        {{ $t('admin.polygonLink.pick.refreshList') }}
      </button>
      <a
        href="https://polygon.codeforces.com"
        target="_blank"
        rel="noopener noreferrer"
        :class="ADMIN_BUTTON_CLASS"
        >{{ $t('admin.polygonLink.nothingShared.openPolygon') }}</a
      >
    </div>
  </GlassCard>
</template>
