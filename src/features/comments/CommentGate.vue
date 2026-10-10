<script setup lang="ts">
import { Lock, LogIn } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { INTERACT_MIN_PROBLEM_COUNT } from '@/api/types/comments';
import InlineBit from '@/components/InlineBit.vue';
import { safeRedirect } from '@/router/safe-redirect';

/** Why there is no composer, in the composer's place: sign in, the solve/mute gate, a locked page, the viewer's running contest, official contest mode. */
const props = defineProps<{
  reason: 'signedOut' | 'gated' | 'locked' | 'contest' | 'official';
  contestKey?: string | null;
}>();
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
      gated: 'comments.gate.gatedTitle',
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
    class="flex flex-col items-center gap-2 rounded-card border border-line bg-surface-solid px-5 py-6 text-center"
  >
    <Lock v-if="reason === 'locked'" aria-hidden="true" class="size-6 text-muted" />
    <InlineBit v-else-if="reason !== 'signedOut'" kind="security" />
    <p class="font-display font-semibold text-content">{{ $t(titleKey) }}</p>
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
    <p v-else-if="reason === 'gated'" class="max-w-md text-sm text-muted">
      {{ $t('comments.gate.gatedBody', { count: INTERACT_MIN_PROBLEM_COUNT }) }}
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
