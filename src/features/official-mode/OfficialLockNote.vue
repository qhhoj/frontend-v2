<script setup lang="ts">
import InlineBit from '@/components/InlineBit.vue';
import { computed } from 'vue';
import { NOTIFICATION_BITS } from '@/features/notifications/notification-bits';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import { useOfficialMode } from './official-mode.queries';
import { untilText } from './official-until';

/** The reason beside a control the official contest locks ("đến 11:30" when `officialModeEndsAt` is known); the control names it with `aria-describedby`. */
defineProps<{ id: string }>();
const mode = useOfficialMode();
const locale = useLocaleStore();
const now = useNow(60_000);
const until = computed(() =>
  mode.endsAt.value === null ? '' : untilText(mode.endsAt.value, now.value, locale.locale),
);
</script>

<template>
  <p
    :id="id"
    data-testid="official-lock-note"
    class="m-0 flex items-center gap-2 text-[13px] text-content"
  >
    <InlineBit :kind="NOTIFICATION_BITS.locked" />
    <span>{{ until ? $t('officialMode.lockedUntil', { until }) : $t('officialMode.locked') }}</span>
  </p>
</template>
