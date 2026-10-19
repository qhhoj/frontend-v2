<script setup lang="ts">
import { computed, ref } from 'vue';
import BitLoop from '@/components/BitLoop.vue';
import BitMascot from '@/components/BitMascot.vue';
import Card from '@/components/ui/Card.vue';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
import { LOW_POWER_PREFERENCES } from '@/theme/low-power';
import type { LowPowerPreference } from '@/theme/low-power';
import { useLowPowerStore } from '@/theme/low-power.store';

/** Board M10C: three cards (each with a small preview), what "on" changes, and where the choice is kept. */
const lowPower = useLowPowerStore();
const EFFECT_KEYS = ['blur', 'blobs', 'motion', 'bit', 'replay', 'ranking', 'editor'] as const;
const machineKey = computed(() => (lowPower.isWeak ? 'lowPower.machineOn' : 'lowPower.machineOff'));
const isSaved = ref(false);
function choose(preference: LowPowerPreference) {
  lowPower.choose(preference);
  isSaved.value = true;
}
</script>

<template>
  <Card id="low-power" data-testid="low-power-section" class="flex scroll-mt-24 flex-col gap-5 p-6">
    <div>
      <h2 class="font-display text-section leading-7 font-semibold">{{ $t('lowPower.title') }}</h2>
      <p class="mt-1 text-meta text-muted">{{ $t('lowPower.lead') }}</p>
    </div>
    <fieldset class="grid gap-3 md:grid-cols-3">
      <legend class="sr-only">{{ $t('lowPower.title') }}</legend>
      <label
        v-for="option in LOW_POWER_PREFERENCES"
        :key="option"
        :data-testid="`low-power-${option}`"
        class="flex cursor-pointer flex-col gap-2 rounded-row border-2 bg-surface-strong p-4"
        :class="lowPower.preference === option ? 'border-accent' : 'border-line-control'"
      >
        <span class="flex min-h-11 items-center gap-3 font-semibold">
          <input
            type="radio"
            name="low-power"
            class="size-5"
            :value="option"
            :checked="lowPower.preference === option"
            @change="choose(option)"
          />
          {{ $t(`lowPower.option.${option}.title`) }}
        </span>
        <span class="text-sm text-muted">{{ $t(`lowPower.option.${option}.body`) }}</span>
        <span
          v-if="option === 'auto'"
          data-testid="low-power-machine"
          class="text-sm font-semibold"
          >{{ $t(machineKey) }}</span
        >
        <span v-else class="flex items-center gap-3 text-xs text-muted">
          <BitMascot v-if="option === 'on'" :look="PLACEMENT_LOOKS.hero" class="[--bit-px:2px]" />
          <BitLoop v-else kind="welcome" class="[--bit-px:2px]" />
          {{ $t(`lowPower.option.${option}.preview`) }}
        </span>
      </label>
    </fieldset>
    <div>
      <p class="text-sm font-semibold">{{ $t('lowPower.effectsTitle') }}</p>
      <ul class="mt-2 grid list-disc gap-1 pl-5 text-sm text-muted md:grid-cols-2">
        <li v-for="key in EFFECT_KEYS" :key="key">{{ $t(`lowPower.effects.${key}`) }}</li>
      </ul>
    </div>
    <p role="status" class="text-meta text-muted">
      <strong v-if="isSaved" class="text-content">{{ $t('lowPower.saved') }}. </strong
      >{{ $t('lowPower.savedNote') }}
    </p>
  </Card>
</template>
