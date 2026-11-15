<script setup lang="ts">
import { Palette } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import BitMascot from '@/components/BitMascot.vue';
import AppButton from '@/components/ui/AppButton.vue';
import IconButton from '@/components/ui/IconButton.vue';
import Popover from '@/components/ui/Popover.vue';
import { translate } from '@/i18n';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
import { LOW_POWER_PREFERENCES } from '@/theme/low-power';
import { useLowPowerStore } from '@/theme/low-power.store';
import AccentChoice from './AccentChoice.vue';
import ContrastChoice from './ContrastChoice.vue';
import ModeChoice from './ModeChoice.vue';
import SegmentedChoice from './SegmentedChoice.vue';
import { useAppearanceChoice } from './use-appearance-choice';

defineProps<{ compact?: boolean }>();
const TITLE_ID = 'appearance-panel-title';
const { reset } = useAppearanceChoice();
const popover = ref<InstanceType<typeof Popover>>();
const isOpen = ref(false);
const lowPower = useLowPowerStore();
const lowPowerOptions = computed(() =>
  LOW_POWER_PREFERENCES.map((value) => ({ value, label: translate(`lowPower.short.${value}`) })),
);
</script>

<template>
  <IconButton
    :compact="compact"
    aria-haspopup="dialog"
    :aria-expanded="isOpen"
    :label="$t('appearance.title')"
    @click="popover?.toggle($event)"
  >
    <Palette aria-hidden="true" class="size-5" />
  </IconButton>
  <Popover ref="popover" :labelledby="TITLE_ID" @show="isOpen = true" @hide="isOpen = false">
    <div class="flex w-[min(20rem,calc(100vw-4rem))] flex-col gap-4">
      <div class="flex items-center justify-between gap-3">
        <p :id="TITLE_ID" class="font-display text-subtitle leading-7 font-bold">
          {{ $t('appearance.title') }}
        </p>
        <BitMascot :look="PLACEMENT_LOOKS.hero" blinks class="[--bit-px:2px]" />
      </div>
      <!-- The segmented groups (Mode, Contrast) name themselves. -->
      <ModeChoice />
      <ContrastChoice />
      <div>
        <p class="mb-2 text-caption leading-4 font-semibold text-muted">
          {{ $t('appearance.accentTitle') }}
        </p>
        <AccentChoice />
      </div>
      <div>
        <p class="mb-2 text-caption leading-4 font-semibold text-muted">
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
        <AppButton tone="link" class="text-meta" @click="reset">{{
          $t('appearance.useSite')
        }}</AppButton>
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
