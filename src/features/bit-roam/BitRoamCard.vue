<script setup lang="ts">
import { computed } from 'vue';
import Card from '@/components/ui/Card.vue';
import Chip from '@/components/ui/Chip.vue';
import Switch from '@/components/ui/Switch.vue';
import LevelSlider from '@/features/appearance/LevelSlider.vue';
import { useSessionStore } from '@/stores/session.store';
import { BIT_ROAM_MAX, useBitRoamStore } from './bit-roam.store';
import { useBitRoamChoice } from './use-bit-roam-choice';

/** Settings → Giao diện: the roaming Bits switch and "Số Bit" (1-5). Off keeps the count, shown greyed. */
const store = useBitRoamStore();
const session = useSessionStore();
const { apply, save, update } = useBitRoamChoice();
const COUNT_STOPS = Array.from({ length: BIT_ROAM_MAX }, (_value, index) => index + 1);
const saveNoteKey = computed(() =>
  session.status === 'authenticated' ? 'appearance.savedAccount' : 'appearance.savedBrowser',
);
</script>

<template>
  <Card data-testid="bit-roam-section" class="flex flex-col gap-6 p-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <p class="flex flex-wrap items-center gap-2">
          <span id="bit-roam-label" class="font-semibold">{{ $t('bitRoam.title') }}</span>
          <Chip tone="accent">{{ $t('bitRoam.new') }}</Chip>
        </p>
        <p class="mt-1 text-meta text-muted">{{ $t('bitRoam.help') }}</p>
      </div>
      <Switch
        :model-value="store.choice.on"
        size="lg"
        labelledby="bit-roam-label"
        @update:model-value="(on) => update({ on })"
      />
    </div>

    <LevelSlider
      id="bit-roam-count"
      :label="$t('bitRoam.count')"
      :readout="String(store.choice.count)"
      :value="store.choice.count"
      :min="1"
      :max="BIT_ROAM_MAX"
      :step="1"
      :disabled="!store.choice.on"
      describedby="bit-roam-count-hint"
      @input="(count) => apply({ count })"
      @commit="save()"
    >
      <div class="flex justify-between text-caption text-muted" aria-hidden="true">
        <span v-for="stop in COUNT_STOPS" :key="stop">{{ stop }}</span>
      </div>
      <p id="bit-roam-count-hint" class="mt-2 text-meta text-muted">
        {{ $t('bitRoam.countHint') }}
      </p>
    </LevelSlider>

    <div class="text-meta text-muted">
      <p>{{ $t('bitRoam.stillNote') }}</p>
      <p role="status">{{ $t(saveNoteKey) }}</p>
    </div>
  </Card>
</template>
