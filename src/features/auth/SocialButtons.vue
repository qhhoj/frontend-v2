<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useSocialProvidersQuery } from './auth.queries';
import { SOCIAL_PROVIDER_LABELS, socialStartUrl } from './social-providers';

defineProps<{ mode: 'login' | 'register' }>();
/**
 * Not a `QueryState`: the buttons are an extra next to a working form, so a failure or an empty list renders nothing
 * and the wait registers no Bits. The skeleton mirrors the usual two buttons (and the divider on login).
 */
const { data: providers, isPending } = useSocialProvidersQuery();
</script>

<template>
  <div
    v-if="isPending"
    aria-hidden="true"
    data-testid="social-skeleton"
    class="flex flex-col gap-3"
  >
    <div v-if="mode === 'login'" class="text-center text-[13px]">
      <SkeletonBlock text class="w-32" />
    </div>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
      <SkeletonBlock v-for="placeholder in 2" :key="placeholder" pill class="h-12" />
    </div>
  </div>
  <div v-else-if="providers?.length" data-testid="social-buttons" class="flex flex-col gap-3">
    <div v-if="mode === 'login'" class="flex items-center gap-3 text-[13px] text-muted">
      <span aria-hidden="true" class="h-px flex-1 bg-line" />
      {{ $t('auth.social.or') }}
      <span aria-hidden="true" class="h-px flex-1 bg-line" />
    </div>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
      <a
        v-for="provider in providers"
        :key="provider"
        :href="socialStartUrl(provider)"
        :aria-label="
          mode === 'login'
            ? $t('auth.social.signInWith', { provider: SOCIAL_PROVIDER_LABELS[provider] })
            : undefined
        "
        class="flex h-12 items-center justify-center rounded-row border border-line bg-surface-strong px-3 text-sm font-semibold text-content hover:bg-surface-hover"
      >
        {{
          mode === 'login'
            ? SOCIAL_PROVIDER_LABELS[provider]
            : $t('auth.social.signUpWith', { provider: SOCIAL_PROVIDER_LABELS[provider] })
        }}
      </a>
    </div>
  </div>
</template>
