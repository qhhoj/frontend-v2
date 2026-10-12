<script setup lang="ts">
import { computed } from 'vue';
import Chip from '@/components/ui/Chip.vue';
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
    <Chip tone="accent" size="md" class="w-fit">{{ $t('orgMembership.pending') }}</Chip>
    <p v-if="request" class="text-sm text-muted">
      {{ $t('orgMembership.sentAt', { date: sentAt }) }}
    </p>
    <p class="text-sm text-muted">{{ $t('orgMembership.pendingLine') }}</p>
    <p v-if="request" class="line-clamp-1 text-sm">{{ request.reason }}</p>
  </div>
</template>
