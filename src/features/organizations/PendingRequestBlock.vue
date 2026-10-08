<script setup lang="ts">
import { computed } from 'vue';
import { formatNumericDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { usePendingRequestQuery } from './organizations.queries';

/** The viewer's pending join request: when it was sent and its reason, one line. */
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
  <div class="flex flex-col gap-2">
    <span
      class="w-fit rounded-pill bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-soft-text"
    >
      {{ $t('orgMembership.pending') }}
    </span>
    <p v-if="request" class="text-sm text-muted">
      {{ $t('orgMembership.sentAt', { date: sentAt }) }}
    </p>
    <p class="text-sm text-muted">{{ $t('orgMembership.pendingLine') }}</p>
    <p v-if="request" class="line-clamp-1 text-sm">{{ request.reason }}</p>
  </div>
</template>
