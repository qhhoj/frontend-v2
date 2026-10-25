<script setup lang="ts">
import { Palette } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import BitMascot from '@/components/BitMascot.vue';
import Popover from '@/components/ui/Popover.vue';
import { translate } from '@/i18n';
import { useMediaQuery } from '@/lib/use-media-query';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
import { GLASS_STOPS, nearestGlassStop } from '@/theme/appearance';
import { LOW_POWER_PREFERENCES } from '@/theme/low-power';
import { useLowPowerStore } from '@/theme/low-power.store';
import { useThemeStore } from '@/theme/theme.store';
import AccentChoice from './AccentChoice.vue';
import ModeChoice from './ModeChoice.vue';
import SegmentedChoice from './SegmentedChoice.vue';
import { useAppearanceChoice } from './use-appearance-choice';

const TITLE_ID = 'appearance-panel-title';
const theme = useThemeStore();
const { shown, update, reset } = useAppearanceChoice();
const reducedTransparency = useMediaQuery('(prefers-reduced-transparency: reduce)');
/** Glass acts on the Glass themes only; in Clay the segments are inert (the stored level is kept). */
const isGlassTheme = computed(() => theme.theme.glass);
const popover = ref<InstanceType<typeof Popover>>();
const isOpen = ref(false);
const glassOptions = computed(() =>
  GLASS_STOPS.map((stop) => ({ value: stop.value, label: translate(stop.labelKey) })),
);
const nearestStop = computed(() => nearestGlassStop(shown.value.glass));
const lowPower = useLowPowerStore();
const lowPowerOptions = computed(() =>
  LOW_POWER_PREFERENCES.map((value) => ({ value, label: translate(`lowPower.short.${value}`) })),
);
</script>

<template>
  <button
    type="button"
    class="inline-flex size-11 items-center justify-center rounded-pill border border-line bg-surface-strong hover:bg-surface-hover"
    aria-haspopup="dialog"
    :aria-expanded="isOpen"
    :aria-label="$t('appearance.title')"
    :title="$t('appearance.title')"
    @click="popover?.toggle($event)"
  >
    <Palette class="size-5" aria-hidden="true" />
  </button>
  <Popover ref="popover" :labelledby="TITLE_ID" @show="isOpen = true" @hide="isOpen = false">
    <div class="flex w-[min(20rem,calc(100vw-4rem))] flex-col gap-4">
      <div class="flex items-center justify-between gap-3">
        <p :id="TITLE_ID" class="font-display text-subtitle leading-7 font-bold">
          {{ $t('appearance.title') }}
        </p>
        <BitMascot :look="PLACEMENT_LOOKS.hero" blinks class="[--bit-px:2px]" />
      </div>
      <!-- ModeChoice's two groups (Style, Mode) name themselves. -->
      <ModeChoice />
      <div>
        <p class="mb-2 text-caption leading-4 font-medium tracking-wider text-muted uppercase">
          {{ $t('appearance.accentTitle') }}
        </p>
        <AccentChoice />
      </div>
      <div>
        <p class="mb-2 text-caption leading-4 font-medium tracking-wider text-muted uppercase">
          {{ $t('appearance.glass') }}
        </p>
        <SegmentedChoice
          :label="$t('appearance.glass')"
          :options="glassOptions"
          :selected="nearestStop"
          :disabled="reducedTransparency || !isGlassTheme"
          @pick="(stop) => void update({ glass: stop })"
        />
        <p v-if="!isGlassTheme" class="mt-2 text-meta text-muted">
          {{ $t('appearance.glassOnly') }}
        </p>
        <p v-else-if="reducedTransparency" class="mt-2 text-meta text-muted">
          {{ $t('appearance.solidByDevice') }}
        </p>
      </div>
      <div>
        <p class="mb-2 text-caption leading-4 font-medium tracking-wider text-muted uppercase">
          {{ $t('lowPower.title') }}
        </p>
        <SegmentedChoice
          :label="$t('lowPower.title')"
          :options="lowPowerOptions"
          :selected="lowPower.preference"
          @pick="(preference) => lowPower.choose(preference)"
        />
      </div>
      <div class="flex items-center justify-between gap-3 border-t border-line pt-3">
        <button
          type="button"
          class="inline-flex min-h-11 items-center px-1 text-meta text-muted underline hover:text-content"
          @click="reset"
        >
          {{ $t('appearance.useSite') }}
        </button>
        <RouterLink
          :to="{ name: 'settings-appearance' }"
          class="inline-flex min-h-11 items-center text-meta text-accent-text underline"
          @click="popover?.hide()"
        >
          {{ $t('appearance.moreSettings') }}
        </RouterLink>
      </div>
    </div>
  </Popover>
</template>
