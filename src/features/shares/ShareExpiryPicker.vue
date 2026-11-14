<script setup lang="ts">
import { computed, useId } from 'vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import { translate } from '@/i18n';
import type { ShareExpiry } from '@/api/types/shares';
import { SHARE_EXPIRIES } from './share-expiry';

/**
 * "Hết hạn": one of the four lifetimes. `null` means no pick yet (the edit dialog keeps the current expiry then).
 * `hint` is the one line under the control.
 */
const model = defineModel<ShareExpiry | null>({ required: true });
defineProps<{ hint?: string }>();
const hintId = useId();
const options = computed(() =>
  SHARE_EXPIRIES.map((value) => ({ value, label: translate(`share.expiry.option.${value}`) })),
);
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span class="text-sm font-semibold" aria-hidden="true">{{ $t('share.expiry.label') }}</span>
    <SegmentedControl
      v-model="model"
      :label="$t('share.expiry.label')"
      :options="options"
      :aria-describedby="hint ? hintId : undefined"
    />
    <p v-if="hint" :id="hintId" class="m-0 text-meta text-muted">{{ hint }}</p>
  </div>
</template>
