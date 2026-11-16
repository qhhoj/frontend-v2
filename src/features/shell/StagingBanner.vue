<script setup lang="ts">
/** Set by the staging deploy (`VITE_STAGING=1`, frontend-v2 deploy.yml): staging.qhhoj.com runs on the production api and data. */
const isStaging = import.meta.env.VITE_STAGING === '1';
</script>

<template>
  <!-- An overlay, not a strip: it takes no layout space, so a full-height page never grows a scrollbar. Clicks pass through. -->
  <div
    v-if="isStaging"
    class="pointer-events-none fixed inset-x-0 top-0 z-toast flex justify-center print:hidden"
  >
    <p
      role="note"
      data-testid="staging-banner"
      class="mt-1 rounded-pill bg-caution-strong px-3 text-tiny font-semibold text-on-caution-strong opacity-90"
    >
      Staging · dữ liệu thật
    </p>
  </div>
</template>
