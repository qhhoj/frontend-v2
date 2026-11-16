<script setup lang="ts">
/** Set by the staging deploy (`VITE_STAGING=1`, frontend-v2 deploy.yml): staging.qhhoj.com runs on the production api and data. */
const isStaging = import.meta.env.VITE_STAGING === '1';
</script>

<template>
  <p
    v-if="isStaging"
    role="note"
    data-testid="staging-banner"
    class="m-0 bg-caution-strong px-4 py-1 text-center text-sm font-semibold text-on-caution-strong print:hidden"
  >
    Staging · dữ liệu thật
  </p>
</template>
