<script setup lang="ts">
import { computed, ref } from 'vue';
import { translate } from '@/i18n';
import BitLoop from '@/components/BitLoop.vue';
import BitMascot from '@/components/BitMascot.vue';
import Card from '@/components/ui/Card.vue';
import ChoiceCards from '@/components/ui/ChoiceCards.vue';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
import { LOW_POWER_PREFERENCES } from '@/theme/low-power';
import type { LowPowerPreference } from '@/theme/low-power';
import { useLowPowerStore } from '@/theme/low-power.store';

/** Board M10C: three cards (each with a small preview), what "on" changes, and where the choice is kept. */
const lowPower = useLowPowerStore();
const EFFECT_KEYS = ['blur', 'blobs', 'motion', 'bit', 'replay', 'ranking', 'editor'] as const;
const machineKey = computed(() => (lowPower.isWeak ? 'lowPower.machineOn' : 'lowPower.machineOff'));
const isSaved = ref(false);
const preference = computed<LowPowerPreference>({
  get: () => lowPower.preference,
  set: (next) => {
    lowPower.choose(next);
    isSaved.value = true;
  },
});
const options = computed(() =>
  LOW_POWER_PREFERENCES.map((value) => ({
    value,
    label: translate(`lowPower.option.${value}.title`),
    description: translate(`lowPower.option.${value}.body`),
  })),
);
</script>

<template>
  <Card id="low-power" data-testid="low-power-section" class="flex scroll-mt-24 flex-col gap-5 p-6">
    <div>
      <h2 class="section-title">{{ $t('lowPower.title') }}</h2>
      <p class="mt-1 text-meta text-muted">{{ $t('lowPower.lead') }}</p>
    </div>
    <ChoiceCards
      v-model="preference"
      name="low-power"
      :legend="$t('lowPower.title')"
      legend-hidden
      :cols="3"
      :options="options"
    >
      <template #extra="{ option }">
        <span
          v-if="option.value === 'auto'"
          data-testid="low-power-machine"
          class="text-sm font-semibold"
          >{{ $t(machineKey) }}</span
        >
        <span v-else class="flex items-center gap-3 text-caption leading-4 text-muted">
          <BitMascot
            v-if="option.value === 'on'"
            :look="PLACEMENT_LOOKS.hero"
            class="[--bit-px:2px]"
          />
          <BitLoop v-else kind="welcome" class="[--bit-px:2px]" />
          {{ $t(`lowPower.option.${option.value}.preview`) }}
        </span>
      </template>
    </ChoiceCards>
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
