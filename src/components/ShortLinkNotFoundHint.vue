<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { arrivedByRedirect, firstNavigationEntry, isOnFirstPage } from '@/lib/arrived-by-redirect';

/** A short link's target the visitor may not see is a 404; say why it may be so. */
const route = useRoute();
const isShortLinkVisit = computed(
  () => isOnFirstPage.value && arrivedByRedirect(firstNavigationEntry(), route.path),
);
</script>

<template>
  <p
    v-if="isShortLinkVisit"
    data-testid="short-link-hint"
    class="max-w-md font-semibold text-content"
  >
    {{ $t('shortLink.notFoundHint') }}
  </p>
</template>
