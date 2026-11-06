<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next';
import { computed } from 'vue';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import AppButton from './AppButton.vue';
import Card from './Card.vue';
import Notice from './Notice.vue';
import type { CardVariant } from './Card.variants';

export type PreparedFileState = 'none' | 'preparing' | 'ready';

/**
 * A file the server builds on request (a contest export, an account data export): the card says what the file is, shows its
 * state, offers "Chuẩn bị tệp" and, once ready, "Tải xuống". While `availableAt` is in the future the prepare button is disabled and
 * says when it can run again. The caller polls and owns the request; this card only draws it. `#facts` holds details of the
 * ready file (size, when it was made, when it expires).
 */
const props = withDefaults(
  defineProps<{
    state: PreparedFileState;
    title: string;
    lead?: string;
    variant?: CardVariant;
    /** Where the ready file is downloaded from. */
    downloadUrl?: string;
    /** The earliest time the file can be prepared again (ISO); a past or absent time means now. */
    availableAt?: string | null;
    /** The prepare request is in flight. */
    pending?: boolean;
    /** Why the last prepare failed, in words. */
    error?: string;
    prepareLabel?: string;
    downloadLabel?: string;
  }>(),
  {
    lead: undefined,
    variant: 'flat',
    downloadUrl: undefined,
    availableAt: null,
    pending: false,
    error: undefined,
    prepareLabel: undefined,
    downloadLabel: undefined,
  },
);
defineEmits<{ prepare: [] }>();
defineOptions({ name: 'UiPreparedFileCard' });

const locale = useLocaleStore();
const isWaiting = computed(
  () => props.availableAt !== null && new Date(props.availableAt).getTime() > Date.now(),
);
const canPrepare = computed(() => props.state !== 'preparing' && !isWaiting.value);
const waitTime = computed(() =>
  props.availableAt ? formatDate(props.availableAt, 'datetime', locale.locale) : '',
);
</script>

<template>
  <Card :variant="variant" padding="md" :title="title" :lead="lead">
    <div class="flex flex-col gap-3">
      <p v-if="state === 'preparing'" class="flex items-center gap-2 text-sm" role="status">
        <LoaderCircle aria-hidden="true" class="size-4 motion-safe:animate-spin" />
        {{ $t('common.prepared.preparing') }}
      </p>
      <p v-else-if="state === 'ready'" class="text-sm font-semibold">
        {{ $t('common.prepared.ready') }}
      </p>
      <p v-else class="text-sm text-muted">{{ $t('common.prepared.none') }}</p>
      <div v-if="$slots.facts" class="text-sm text-muted"><slot name="facts" /></div>
      <div class="flex flex-wrap items-center gap-2">
        <AppButton
          tone="primary"
          :loading="pending"
          :disabled="!canPrepare"
          @click="$emit('prepare')"
        >
          {{ prepareLabel ?? $t('common.prepared.prepare') }}
        </AppButton>
        <AppButton v-if="state === 'ready' && downloadUrl" :href="downloadUrl" download>
          {{ downloadLabel ?? $t('common.prepared.download') }}
        </AppButton>
      </div>
      <p v-if="isWaiting && state !== 'preparing'" class="text-sm text-muted">
        {{ $t('common.prepared.waitUntil', { time: waitTime }) }}
      </p>
      <Notice v-if="error" tone="danger" compact>{{ error }}</Notice>
    </div>
  </Card>
</template>
