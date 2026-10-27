<script setup lang="ts">
import { useRoute } from 'vue-router';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { useSocialProvidersQuery } from './auth.queries';
import { SOCIAL_PROVIDER_LABELS, socialStartUrl } from './social-providers';
import { rememberSocialReturn } from './social-return';

/**
 * Not a `QueryState`: the buttons are an extra next to a working form, so a failure or an empty list renders nothing
 * and the wait registers no Bits. The skeleton mirrors the divider and two buttons.
 */
const { data: providers, isPending } = useSocialProvidersQuery();
const route = useRoute();
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
      <AppButton
        v-for="provider in providers"
        :key="provider"
        :href="socialStartUrl(provider)"
        :aria-label="$t('auth.social.signInWith', { provider: SOCIAL_PROVIDER_LABELS[provider] })"
        @click="rememberSocialReturn(route.query.redirect)"
      >
        {{ SOCIAL_PROVIDER_LABELS[provider] }}
      </AppButton>
    </div>
  </div>
</template>
