<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { X } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { fetchSite } from '@/api/site.api';
import IconButton from '@/components/ui/IconButton.vue';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
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
    <SettingsNotice tone="info">
      <span class="block whitespace-pre-line">{{ text }}</span>
      <template #action>
        <IconButton :label="$t('siteNotice.dismiss')" @click="dismiss">
          <X aria-hidden="true" class="size-5" />
        </IconButton>
      </template>
    </SettingsNotice>
  </section>
</template>
