<script setup lang="ts">
import BitMascot from '@/components/BitMascot.vue';
import { errorMessageKey } from '@/i18n/error-message';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
import { useWaitingWhile } from '@/stores/use-waiting-while';
import SkeletonBlock from './SkeletonBlock.vue';

const props = defineProps<{ loading: boolean; error: unknown }>();
defineEmits<{ retry: [] }>();
// `loading` is the query's isPending: first data only. Background refetches and kept data never register.
useWaitingWhile(() => props.loading);
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
    <BitMascot
      data-testid="bit"
      :look="PLACEMENT_LOOKS.rejected"
      closed-eyes
      class="[--bit-px:3px]"
    />
    <span>{{ $t(errorMessageKey(error)) }}</span>
    <button
      type="button"
      class="min-h-11 rounded-pill border border-line px-4 font-semibold hover:bg-surface-hover"
      @click="$emit('retry')"
    >
      {{ $t('common.retry') }}
    </button>
  </div>
  <slot v-else />
</template>
