<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useSocialProvidersQuery } from './auth.queries';
import { SOCIAL_PROVIDER_LABELS, socialStartUrl } from './social-providers';

/**
 * Not a `QueryState`: the buttons are an extra next to a working form, so a failure or an empty list renders nothing
 * and the wait registers no Bits. The skeleton mirrors the divider and two buttons.
 */
const { data: providers, isPending } = useSocialProvidersQuery();
const ROW = 'grid grid-cols-[repeat(auto-fit,minmax(6rem,1fr))] gap-2';
</script>

<template>
  <div
    v-if="isPending"
    aria-hidden="true"
    data-testid="social-skeleton"
    class="flex flex-col gap-4"
  >
    <div class="text-center text-meta"><SkeletonBlock text class="w-32" /></div>
    <div :class="ROW">
      <SkeletonBlock v-for="placeholder in 2" :key="placeholder" pill class="h-11" />
    </div>
  </div>
  <div v-else-if="providers?.length" data-testid="social-buttons" class="flex flex-col gap-4">
    <div class="flex items-center gap-3 text-meta text-muted">
      <span aria-hidden="true" class="h-px flex-1 bg-line" />
      {{ $t('auth.social.or') }}
      <span aria-hidden="true" class="h-px flex-1 bg-line" />
    </div>
    <div :class="ROW">
      <a
        v-for="provider in providers"
        :key="provider"
        :href="socialStartUrl(provider)"
        :aria-label="$t('auth.social.signInWith', { provider: SOCIAL_PROVIDER_LABELS[provider] })"
        class="flex h-11 items-center justify-center rounded-pill border border-line-strong bg-surface-solid px-3 text-sm font-semibold text-content hover:bg-surface-hover"
      >
        {{ SOCIAL_PROVIDER_LABELS[provider] }}
      </a>
    </div>
  </div>
</template>
