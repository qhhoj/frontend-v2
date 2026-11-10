<script setup lang="ts">
/** The served build, so staff can tell which deploy a page came from (it left the footer; Settings > Appearance shows it). */
const BUILD_DATE = __BUILD_DATE__;
const APP_COMMIT = __APP_COMMIT__;
const commitUrl = /^[0-9a-f]{7}$/.test(APP_COMMIT)
  ? `https://github.com/qhhoj/frontend-v2/commit/${APP_COMMIT}`
  : null;
</script>

<template>
  <p data-testid="app-version" class="text-meta text-muted" :title="$t('footer.versionTitle')">
    {{ $t('footer.version') }}
    <span class="font-mono"
      ><a v-if="commitUrl" :href="commitUrl" class="underline" rel="noopener">{{ APP_COMMIT }}</a
      ><template v-else>{{ APP_COMMIT }}</template> · {{ BUILD_DATE }}</span
    >
  </p>
</template>
