<script setup lang="ts">
import { computed } from 'vue';
import BitMascot from '@/components/BitMascot.vue';
import GlassCard from '@/components/GlassCard.vue';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
import { useSessionStore } from '@/stores/session.store';
import { GLASS_STOPS, nearestGlassStop } from '@/theme/appearance';
import { useAppearanceStore } from '@/theme/appearance.store';
import { useThemeStore } from '@/theme/theme.store';
import AccentChoice from './AccentChoice.vue';
import AppearancePreview from './AppearancePreview.vue';
import ModeChoice from './ModeChoice.vue';
import { useAppearanceChoice } from './use-appearance-choice';
import { useReducedTransparency } from './use-reduced-transparency';

const appearance = useAppearanceStore();
const session = useSessionStore();
const theme = useThemeStore();
const { shown, apply, save, update, turnOff, reset } = useAppearanceChoice();
const reducedTransparency = useReducedTransparency();
/** Glass and Glow act on the Glass themes only; Clay is flat, so the controls are inert there (values are kept). */
const frosted = computed(() => theme.theme.glass);

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
const onGlass = (event: Event) =>
  apply({ glass: Number((event.target as HTMLInputElement).value) });
const onGlow = (event: Event) => apply({ glow: Number((event.target as HTMLInputElement).value) });
</script>

<template>
  <section class="mx-auto flex max-w-[1160px] flex-col gap-5 px-4 py-8 sm:px-8">
    <div class="flex items-center justify-between gap-4">
      <div>
        <p class="text-sm text-muted">{{ $t('appearance.breadcrumb') }}</p>
        <h1 class="mt-1.5 font-display text-4xl font-bold">{{ $t('appearance.title') }}</h1>
      </div>
      <BitMascot
        data-testid="appearance-bit"
        :look="PLACEMENT_LOOKS.hero"
        blinks
        class="[--bit-px:4px] sm:[--bit-px:6px]"
      />
    </div>
    <div class="flex flex-wrap items-start gap-5">
      <GlassCard class="flex min-w-0 flex-[1_1_420px] flex-col gap-6 p-6">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p id="own-look-label" class="font-semibold">{{ $t('appearance.customLook') }}</p>
            <p class="mt-1 text-[13px] text-muted">{{ $t('appearance.customLookHelp') }}</p>
          </div>
          <button
            type="button"
            role="switch"
            :aria-checked="isOn"
            aria-labelledby="own-look-label"
            class="flex h-11 w-14 shrink-0 items-center rounded-pill border border-line-accent p-1"
            :class="isOn ? 'bg-gradient-accent justify-end' : 'justify-start bg-surface-strong'"
            @click="toggle"
          >
            <span aria-hidden="true" class="size-8 rounded-full bg-content" />
          </button>
        </div>

        <div>
          <p class="font-semibold">{{ $t('appearance.mode') }}</p>
          <div class="mt-2.5"><ModeChoice /></div>
        </div>

        <div>
          <p class="font-semibold">{{ $t('appearance.accentTitle') }}</p>
          <p class="mt-1 text-[13px] text-muted">{{ $t('appearance.accentHelp') }}</p>
          <div class="mt-3"><AccentChoice :disabled="!isOn" /></div>
        </div>

        <div>
          <div class="flex items-baseline justify-between">
            <label for="glass-level" class="font-semibold">{{ $t('appearance.glass') }}</label>
            <span class="font-mono text-[13px] text-muted">{{ $t(glassStopKey) }}</span>
          </div>
          <p class="mt-1 text-[13px] text-muted">{{ $t('appearance.glassHelp') }}</p>
          <input
            id="glass-level"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="shown.glass"
            :disabled="!isOn || reducedTransparency || !frosted"
            :aria-valuetext="$t(glassStopKey)"
            class="mt-2 h-11 w-full accent-accent disabled:cursor-not-allowed"
            @input="onGlass"
            @change="save()"
          />
          <div class="flex justify-between text-xs text-muted" aria-hidden="true">
            <span v-for="stop in GLASS_STOPS" :key="stop.value">{{ $t(stop.labelKey) }}</span>
          </div>
          <p v-if="reducedTransparency" class="mt-2 text-[13px] text-muted">
            {{ $t('appearance.solidByDevice') }}
          </p>
        </div>

        <div>
          <div class="flex items-baseline justify-between">
            <label for="glow-level" class="font-semibold">{{ $t('appearance.glow') }}</label>
            <span class="font-mono text-[13px] text-muted">{{ shown.glow }}%</span>
          </div>
          <input
            id="glow-level"
            type="range"
            min="0"
            max="100"
            step="5"
            :value="shown.glow"
            :disabled="!isOn || !frosted"
            class="mt-2 h-11 w-full accent-accent disabled:cursor-not-allowed"
            @input="onGlow"
            @change="save()"
          />
          <p v-if="!frosted" class="mt-2 text-[13px] text-muted">
            {{ $t('appearance.glassOnly') }}
          </p>
        </div>

        <div>
          <button
            type="button"
            class="inline-flex min-h-11 items-center rounded-pill border border-line-strong px-4.5 text-sm font-medium hover:bg-surface-hover"
            @click="reset"
          >
            {{ $t('appearance.reset') }}
          </button>
        </div>
      </GlassCard>

      <section class="flex min-w-0 flex-[1_1_420px] flex-col gap-3.5">
        <h2 class="text-[13px] font-semibold tracking-wider text-muted uppercase">
          {{ $t('appearance.preview') }}
        </h2>
        <AppearancePreview />
        <p role="status" class="text-[13px] text-muted">{{ $t(saveNoteKey) }}</p>
      </section>
    </div>
  </section>
</template>
