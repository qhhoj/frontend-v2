<script setup lang="ts">
import { computed, useId } from 'vue';
import { usePermissions } from '@/stores/use-permissions';
import { needsPermissionText } from './permission-text';

/**
 * An on/off setting that applies at once. Inside a form saved later, use a checkbox with a description instead.
 * Off: `surface-strong` track with a `line-strong` frame and a muted thumb. On: accent track, `on-accent` thumb.
 * `lockedBy` (a permission codename) disables it and says which permission in words; superusers see the codename as a tooltip.
 */
const model = defineModel<boolean>({ required: true });
const props = defineProps<{ label: string; description?: string; lockedBy?: string }>();
const labelId = useId();
const { isSuperuser } = usePermissions();
const lockedText = computed(() => (props.lockedBy ? needsPermissionText(props.lockedBy) : ''));
const toggle = () => {
  if (!props.lockedBy) model.value = !model.value;
};
</script>

<template>
  <div class="flex items-start gap-3">
    <button
      type="button"
      role="switch"
      :aria-checked="model"
      :aria-disabled="lockedBy ? 'true' : undefined"
      :aria-labelledby="labelId"
      :aria-describedby="lockedBy ? `${labelId}-locked` : undefined"
      class="group relative mt-0.5 inline-flex h-6 w-10 shrink-0 items-center rounded-pill border border-line-strong bg-surface-strong transition-colors before:absolute before:-inset-2.5 aria-checked:border-accent aria-checked:bg-accent aria-disabled:cursor-not-allowed"
      @click="toggle"
    >
      <span
        aria-hidden="true"
        class="ml-0.5 size-4.5 rounded-full bg-muted transition-transform group-aria-checked:translate-x-4 group-aria-checked:bg-on-accent"
      />
    </button>
    <div class="flex min-w-0 flex-col">
      <span :id="labelId" class="text-sm font-semibold">{{ label }}</span>
      <span v-if="description" class="text-sm text-muted">{{ description }}</span>
      <span
        v-if="lockedBy"
        :id="`${labelId}-locked`"
        class="text-xs text-muted"
        :title="isSuperuser ? lockedBy : undefined"
      >
        {{ lockedText }}
      </span>
    </div>
  </div>
</template>
