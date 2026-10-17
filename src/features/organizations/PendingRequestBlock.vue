<script setup lang="ts">
import { computed } from 'vue';
import { formatNumericDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { usePendingRequestQuery } from './organizations.queries';

/** The viewer's pending join request (its chip sits by the name): when it was sent and its reason, one line. */
const props = defineProps<{ slug: string; requestId: string }>();
const locale = useLocaleStore();
const { data: request } = usePendingRequestQuery(
  () => props.slug,
  () => props.requestId,
);
const sentAt = computed(() =>
  request.value ? formatNumericDateTime(request.value.createdAt, locale.locale) : '',
);
</script>

<template>
  <div class="flex flex-col gap-1 text-meta md:text-right">
    <p v-if="request" class="text-muted">
      {{ $t('orgMembership.sentAt', { date: sentAt }) }}
    </p>
    <p class="text-muted">{{ $t('orgMembership.pendingLine') }}</p>
    <p v-if="request" class="line-clamp-1">{{ request.reason }}</p>
  </div>
</template>
