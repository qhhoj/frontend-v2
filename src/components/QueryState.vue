<script setup lang="ts">
import { errorMessageKey } from '@/i18n/error-message';
import { useWaitingWhile } from '@/stores/use-waiting-while';
import InlineBit from './InlineBit.vue';
import SkeletonBlock from './SkeletonBlock.vue';
import AppButton from './ui/AppButton.vue';

const props = withDefaults(
  defineProps<{ loading: boolean; error: unknown; registersWait?: boolean }>(),
  {
    registersWait: true,
  },
);
defineEmits<{ retry: [] }>();
// `loading` is the query's isPending: first data only. Background refetches and kept data never register.
// `registersWait` is false for data beside a form the viewer can already use (the signup pickers): no Bit.
useWaitingWhile(() => props.loading && props.registersWait);
</script>

<template>
  <!-- `contents`: the skeleton lays out exactly as the content will, with no wrapper box of its own. The shell announces "loading" once. -->
  <div v-if="loading" class="contents" aria-hidden="true" data-testid="query-skeleton">
    <slot name="skeleton"><SkeletonBlock class="h-24 w-full" /></slot>
  </div>
  <div
    v-else-if="error"
    role="alert"
    class="flex flex-wrap items-center justify-center gap-3 py-6 text-center"
  >
    <!-- The message beside it says what happened, so the sweating Bit is decoration. -->
    <InlineBit kind="sweat" data-testid="bit" />
    <span>{{ $t(errorMessageKey(error)) }}</span>
    <AppButton @click="$emit('retry')">{{ $t('common.retry') }}</AppButton>
  </div>
  <slot v-else />
</template>
