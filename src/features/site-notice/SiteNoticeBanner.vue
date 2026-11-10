<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { fetchSite } from '@/api/site.api';
import Notice from '@/components/ui/Notice.vue';
import { SITE_STALE_MS, siteKey } from '@/features/official-mode/official-mode.queries';
import { SITE_NOTICE_KEY, noticeFingerprint, readDismissed, writeDismissed } from './site-notice';

/** The staff's site-wide notice (misc config `top_notification`) above every page, for everyone, until the visitor closes it. */
const site = useQuery({ queryKey: siteKey, queryFn: fetchSite, staleTime: SITE_STALE_MS });
const text = computed(() => site.data.value?.config[SITE_NOTICE_KEY]?.trim() ?? '');
const dismissed = ref(readDismissed());
const isShown = computed(
  () => text.value !== '' && dismissed.value !== noticeFingerprint(text.value),
);

function dismiss() {
  dismissed.value = noticeFingerprint(text.value);
  writeDismissed(dismissed.value);
}
</script>

<template>
  <section
    v-if="isShown"
    role="region"
    data-testid="site-notice"
    :aria-label="$t('siteNotice.region')"
    class="page-gutter pt-4"
  >
    <Notice tone="info" dismissible @dismiss="dismiss">
      <span class="block whitespace-pre-line">{{ text }}</span>
    </Notice>
  </section>
</template>
