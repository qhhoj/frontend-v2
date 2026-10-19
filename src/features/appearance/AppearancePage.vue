<script setup lang="ts">
import { computed } from 'vue';
import BitMascot from '@/components/BitMascot.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Card from '@/components/ui/Card.vue';
import Switch from '@/components/ui/Switch.vue';
import SettingsLayout from '@/features/account/settings/SettingsLayout.vue';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
import { useMediaQuery } from '@/lib/use-media-query';
import { useSessionStore } from '@/stores/session.store';
import { GLASS_STOPS, nearestGlassStop } from '@/theme/appearance';
import { useAppearanceStore } from '@/theme/appearance.store';
import { useThemeStore } from '@/theme/theme.store';
import BitRoamCard from '@/features/bit-roam/BitRoamCard.vue';
import AccentChoice from './AccentChoice.vue';
import AppearancePreview from './AppearancePreview.vue';
import LevelSlider from './LevelSlider.vue';
import LowPowerChoice from './LowPowerChoice.vue';
import ModeChoice from './ModeChoice.vue';
import { useAppearanceChoice } from './use-appearance-choice';

const appearance = useAppearanceStore();
const session = useSessionStore();
const theme = useThemeStore();
const { shown, apply, save, update, turnOff, reset } = useAppearanceChoice();
const reducedTransparency = useMediaQuery('(prefers-reduced-transparency: reduce)');
/** Glass and Glow act on the Glass themes only; Clay is flat, so the controls are inert there (values are kept). */
const isGlassTheme = computed(() => theme.theme.glass);

const isOn = computed(() => appearance.look !== null);
const glassStopKey = computed(
  () => GLASS_STOPS.find((stop) => stop.value === nearestGlassStop(shown.value.glass))!.labelKey,
);
const saveNoteKey = computed(() =>
  !isOn.value
    ? 'appearance.showingSite'
    : session.status === 'authenticated'
      ? 'appearance.savedAccount'
      : 'appearance.savedBrowser',
);
const toggle = () => (isOn.value ? turnOff() : update({}));
</script>

<template>
  <SettingsLayout>
    <div class="flex items-center justify-between gap-4">
      <h2 class="page-title">{{ $t('appearance.title') }}</h2>
      <BitMascot
        data-testid="appearance-bit"
        :look="PLACEMENT_LOOKS.hero"
        blinks
        class="[--bit-px:4px] sm:[--bit-px:6px]"
      />
    </div>
    <div class="flex flex-wrap items-start gap-5">
      <Card class="flex min-w-0 flex-[1_1_420px] flex-col gap-6 p-6">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p id="own-look-label" class="font-semibold">{{ $t('appearance.customLook') }}</p>
            <p class="mt-1 text-meta text-muted">{{ $t('appearance.customLookHelp') }}</p>
          </div>
          <Switch
            :model-value="isOn"
            size="lg"
            labelledby="own-look-label"
            @update:model-value="toggle"
          />
        </div>

        <div>
          <p class="font-semibold">{{ $t('appearance.styleAndMode') }}</p>
          <div class="mt-2.5"><ModeChoice /></div>
        </div>

        <div>
          <p class="font-semibold">{{ $t('appearance.accentTitle') }}</p>
          <p class="mt-1 text-meta text-muted">{{ $t('appearance.accentHelp') }}</p>
          <div class="mt-3"><AccentChoice :disabled="!isOn" /></div>
        </div>

        <LevelSlider
          id="glass-level"
          :label="$t('appearance.glass')"
          :readout="$t(glassStopKey)"
          :help="$t('appearance.glassHelp')"
          :value="shown.glass"
          :step="1"
          :disabled="!isOn || reducedTransparency || !isGlassTheme"
          :value-text="$t(glassStopKey)"
          @input="(glass) => apply({ glass })"
          @commit="save()"
        >
          <div class="flex justify-between text-xs text-muted" aria-hidden="true">
            <span v-for="stop in GLASS_STOPS" :key="stop.value">{{ $t(stop.labelKey) }}</span>
          </div>
          <p v-if="reducedTransparency" class="mt-2 text-meta text-muted">
            {{ $t('appearance.solidByDevice') }}
          </p>
        </LevelSlider>

        <LevelSlider
          id="glow-level"
          :label="$t('appearance.glow')"
          :readout="`${shown.glow}%`"
          :value="shown.glow"
          :step="5"
          :disabled="!isOn || !isGlassTheme"
          @input="(glow) => apply({ glow })"
          @commit="save()"
        >
          <p v-if="!isGlassTheme" class="mt-2 text-meta text-muted">
            {{ $t('appearance.glassOnly') }}
          </p>
        </LevelSlider>

        <div>
          <AppButton @click="reset">{{ $t('appearance.reset') }}</AppButton>
        </div>
      </Card>

      <section class="flex min-w-0 flex-[1_1_420px] flex-col gap-3.5">
        <h2 class="text-meta font-semibold tracking-wider text-muted uppercase">
          {{ $t('appearance.preview') }}
        </h2>
        <AppearancePreview />
        <p role="status" class="text-meta text-muted">{{ $t(saveNoteKey) }}</p>
      </section>
    </div>
    <BitRoamCard />
    <LowPowerChoice />
  </SettingsLayout>
</template>
