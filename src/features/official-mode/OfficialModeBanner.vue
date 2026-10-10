<script setup lang="ts">
import { useSessionStore } from '@/stores/session.store';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import { NOTIFICATION_BITS } from '@/features/notifications/notification-bits';
import { computed } from 'vue';
import { useLocaleStore } from '@/stores/locale.store';
import { useNow } from '@/lib/use-now';
import { useOfficialMode, useRefetchWhenOfficialModeEnds } from './official-mode.queries';
import { untilText } from './official-until';

/** M1B warning card: "Chế độ thi chính thức đến 11:30 hôm nay" (`officialModeEndsAt`, requires VNOI backend B8 ask; plain title when null) and what is locked; a superuser is told they are exempt. */
const mode = useOfficialMode();
useRefetchWhenOfficialModeEnds();
const locale = useLocaleStore();
const now = useNow(60_000);
const until = computed(() =>
  mode.endsAt.value === null ? '' : untilText(mode.endsAt.value, now.value, locale.locale),
);
const session = useSessionStore();
</script>

<template>
  <!-- Always mounted, so a mode switched on while the page is open is announced politely. -->
  <div v-if="session.user" role="status">
    <section
      v-if="mode.isActive.value"
      role="region"
      data-testid="official-banner"
      :aria-label="$t('officialMode.region')"
      class="page-gutter pt-4"
    >
      <SettingsNotice tone="warning" :bit="NOTIFICATION_BITS.locked">
        <strong class="block">{{
          until ? $t('officialMode.bannerUntil', { until }) : $t('officialMode.bannerTitle')
        }}</strong>
        {{ $t('officialMode.bannerBody') }}
        <template v-if="mode.isExempt.value">{{ ' ' }}{{ $t('officialMode.exempt') }}</template>
      </SettingsNotice>
    </section>
  </div>
</template>
