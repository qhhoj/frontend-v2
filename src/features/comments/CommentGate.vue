<script setup lang="ts">
import { Lock, LogIn } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { INTERACT_MIN_PROBLEM_COUNT } from '@/api/types/comments';
import InlineBit from '@/components/InlineBit.vue';
import { safeRedirect } from '@/router/safe-redirect';
import { solvedPercent } from './composer-state';

/**
 * Why there is no composer, in the composer's place: sign in, too few solved problems (with the progress), a muted account,
 * a locked page, the viewer's running contest, official contest mode.
 */
const props = withDefaults(
  defineProps<{
    reason: 'signedOut' | 'needsSolved' | 'muted' | 'locked' | 'contest' | 'official';
    contestKey?: string | null;
    solved?: number | null;
    required?: number | null;
  }>(),
  { contestKey: null, solved: null, required: null },
);
const requiredCount = computed(() => props.required ?? INTERACT_MIN_PROBLEM_COUNT);
const solvedCount = computed(() => props.solved ?? 0);
const EASY_PROBLEMS = { name: 'problems', query: { sort: '-userCount' } };
const route = useRoute();
const signIn = computed(() => ({
  name: 'login',
  query: { redirect: safeRedirect(route.fullPath) },
}));
const register = computed(() => ({
  name: 'register',
  query: { redirect: safeRedirect(route.fullPath) },
}));
const titleKey = computed(
  () =>
    ({
      signedOut: 'comments.gate.signedOutTitle',
      needsSolved: 'comments.gate.needsSolvedTitle',
      muted: 'comments.gate.mutedTitle',
      locked: 'comments.gate.lockedTitle',
      contest: 'comments.gate.contestTitle',
      official: 'comments.gate.officialTitle',
    })[props.reason],
);
</script>

<template>
  <div
    data-testid="comment-gate"
    :data-reason="reason"
    class="flex flex-col gap-2 rounded-card border border-line bg-surface-solid px-5 py-6"
    :class="
      reason === 'needsSolved' || reason === 'muted' ? 'items-start' : 'items-center text-center'
    "
  >
    <Lock v-if="reason === 'locked'" aria-hidden="true" class="size-6 text-muted" />
    <InlineBit v-else-if="reason !== 'signedOut' && reason !== 'needsSolved'" kind="security" />
    <p class="font-display font-semibold text-content">
      {{ $t(titleKey, { count: requiredCount }) }}
    </p>
    <template v-if="reason === 'signedOut'">
      <RouterLink
        :to="signIn"
        class="mt-1 inline-flex min-h-11 items-center gap-2 rounded-pill bg-gradient-accent px-5 font-semibold text-on-accent"
      >
        <LogIn aria-hidden="true" class="size-4" />
        {{ $t('comments.gate.signIn') }}
      </RouterLink>
      <p class="text-sm text-muted">
        {{ $t('comments.gate.noAccount') }}
        <RouterLink :to="register" class="font-semibold text-accent-text hover:underline">
          {{ $t('comments.gate.register') }}
        </RouterLink>
      </p>
    </template>
    <template v-else-if="reason === 'needsSolved'">
      <p class="max-w-md text-sm text-muted">{{ $t('comments.gate.needsSolvedBody') }}</p>
      <div class="w-full max-w-md">
        <div class="mb-1.5 flex justify-between text-sm">
          <span>{{ $t('comments.gate.solved') }}</span>
          <span class="font-mono font-semibold tabular-nums"
            >{{ solvedCount }} / {{ requiredCount }}</span
          >
        </div>
        <div
          role="progressbar"
          :aria-label="$t('comments.gate.solvedLabel')"
          aria-valuemin="0"
          :aria-valuemax="requiredCount"
          :aria-valuenow="Math.min(solvedCount, requiredCount)"
          class="h-2 overflow-hidden rounded-pill bg-surface-strong"
        >
          <div
            class="h-full rounded-pill bg-positive"
            :style="{ width: `${solvedPercent(solvedCount, requiredCount)}%` }"
          />
        </div>
      </div>
      <RouterLink
        :to="EASY_PROBLEMS"
        class="text-sm font-semibold text-accent-text hover:underline"
      >
        {{ $t('comments.gate.easyProblems') }}
      </RouterLink>
    </template>
    <p v-else-if="reason === 'muted'" class="max-w-md text-sm text-muted">
      {{ $t('comments.gate.mutedBody') }}
      <RouterLink
        :to="{ name: 'ticket-new' }"
        class="font-semibold text-accent-text hover:underline"
        >{{ $t('comments.gate.mutedLink') }}</RouterLink
      >.
    </p>
    <p v-else-if="reason === 'locked'" class="max-w-md text-sm text-muted">
      {{ $t('comments.gate.lockedBody') }}
    </p>
    <p v-else-if="reason === 'contest'" class="max-w-md text-sm text-muted">
      {{ $t('comments.gate.contestBody') }}
      <RouterLink
        v-if="contestKey"
        :to="{ name: 'contest-announcements', params: { key: contestKey } }"
        class="font-semibold text-accent-text hover:underline"
        >{{ $t('comments.gate.contestLink') }}</RouterLink
      >.
    </p>
    <p v-else class="max-w-md text-sm text-muted">{{ $t('comments.gate.officialBody') }}</p>
  </div>
</template>
