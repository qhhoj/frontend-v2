<script setup lang="ts">
import { computed } from 'vue';
import BitMascot from '@/components/BitMascot.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Card from '@/components/ui/Card.vue';
import SettingsLayout from '@/features/account/settings/SettingsLayout.vue';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
import { useSessionStore } from '@/stores/session.store';
import { useAppearanceStore } from '@/theme/appearance.store';
import BitRoamCard from '@/features/bit-roam/BitRoamCard.vue';
import BuildInfo from '@/features/shell/BuildInfo.vue';
import AccentChoice from './AccentChoice.vue';
import AppearancePreview from './AppearancePreview.vue';
import BackgroundChoice from './BackgroundChoice.vue';
import ContrastChoice from './ContrastChoice.vue';
import LowPowerChoice from './LowPowerChoice.vue';
import PaletteChoice from './PaletteChoice.vue';
import ModeChoice from './ModeChoice.vue';
import { useAppearanceChoice } from './use-appearance-choice';

const appearance = useAppearanceStore();
const session = useSessionStore();
const { reset } = useAppearanceChoice();

const saveNoteKey = computed(() =>
  appearance.look === null
    ? 'appearance.showingSite'
    : session.status === 'authenticated'
      ? 'appearance.savedAccount'
      : 'appearance.savedBrowser',
);
</script>

<template>
  <SettingsLayout>
    <div class="flex items-center justify-between gap-4">
      <h2 class="section-title">{{ $t('appearance.title') }}</h2>
      <BitMascot
        data-testid="appearance-bit"
        :look="PLACEMENT_LOOKS.hero"
        blinks
        class="[--bit-px:4px] sm:[--bit-px:6px]"
      />
    </div>
    <div class="flex flex-wrap items-start gap-5">
      <Card class="flex min-w-0 flex-[1_1_420px] flex-col gap-6 p-6">
        <div>
          <p class="font-semibold">{{ $t('appearance.paletteTitle') }}</p>
          <p class="mt-1 text-meta text-muted">{{ $t('appearance.paletteHelp') }}</p>
          <div class="mt-3"><PaletteChoice /></div>
        </div>

        <div>
          <p class="font-semibold">{{ $t('appearance.mode') }}</p>
          <div class="mt-2.5"><ModeChoice /></div>
        </div>

        <div>
          <p class="font-semibold">{{ $t('appearance.contrast') }}</p>
          <p class="mt-1 text-meta text-muted">{{ $t('appearance.contrastHelp') }}</p>
          <div class="mt-2.5"><ContrastChoice /></div>
        </div>

        <div>
          <p class="font-semibold">{{ $t('appearance.accentTitle') }}</p>
          <p class="mt-1 text-meta text-muted">{{ $t('appearance.accentHelp') }}</p>
          <div class="mt-3"><AccentChoice /></div>
        </div>

        <div>
          <p class="font-semibold">{{ $t('appearance.backgroundTitle') }}</p>
          <p class="mt-1 text-meta text-muted">{{ $t('appearance.backgroundHelp') }}</p>
          <div class="mt-3"><BackgroundChoice /></div>
        </div>

        <div>
          <AppButton @click="reset">{{ $t('appearance.reset') }}</AppButton>
        </div>
      </Card>

      <section class="flex min-w-0 flex-[1_1_420px] flex-col gap-3.5">
        <h2 class="section-title">
          {{ $t('appearance.preview') }}
        </h2>
        <AppearancePreview />
        <p role="status" class="text-meta text-muted">{{ $t(saveNoteKey) }}</p>
      </section>
    </div>
    <BitRoamCard />
    <LowPowerChoice />
    <BuildInfo />
  </SettingsLayout>
</template>
