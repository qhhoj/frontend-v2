<script setup lang="ts">
import type { PasswordScore } from '@/lib/password-strength';

defineProps<{ password: string; score: PasswordScore }>();
const STEPS = [1, 2, 3, 4] as const;
/** Red for weak, amber for fair, green from strong; the level is always written next to it. */
const FILLS: Record<PasswordScore, string> = {
  0: 'bg-line',
  1: 'bg-negative',
  2: 'bg-verdict-tle',
  3: 'bg-positive',
  4: 'bg-positive',
};
const TEXTS: Record<PasswordScore, string> = {
  0: 'text-muted',
  1: 'text-negative',
  2: 'text-verdict-tle',
  3: 'text-positive',
  4: 'text-positive',
};
const STRONG_SCORE = 3;
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div
      role="meter"
      :aria-label="$t('auth.strength.label')"
      aria-valuemin="0"
      aria-valuemax="4"
      :aria-valuenow="score"
      :aria-valuetext="$t(`auth.strength.level.${score}`)"
      class="flex gap-1"
    >
      <span
        v-for="step in STEPS"
        :key="step"
        :data-step-filled="step <= score ? 'true' : 'false'"
        class="h-1.5 flex-1 rounded-pill"
        :class="step <= score ? FILLS[score] : 'bg-line'"
      />
    </div>
    <!-- Always rendered, so the line's height is reserved before the first keystroke. -->
    <span data-testid="strength-level" class="min-h-5 text-[13px]" :class="TEXTS[score]">
      <template v-if="password">
        {{ $t(`auth.strength.level.${score}`)
        }}<template v-if="score < STRONG_SCORE"> — {{ $t('auth.strength.tip') }}</template>
      </template>
    </span>
  </div>
</template>
