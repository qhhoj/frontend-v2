<script setup lang="ts">
import { needsPermissionText } from '../../ui/permission-text';

/**
 * Disables a chip field behind a permission and names it in words. The chip fields' own `lockedBy` still prints the
 * codename, so contest fields lock through this wrapper until that is fixed in ui/ExactChips.
 */
defineProps<{ lockedBy?: string }>();
</script>

<template>
  <fieldset :disabled="Boolean(lockedBy)" class="m-0 flex min-w-0 flex-col gap-1 border-0 p-0">
    <slot />
    <p v-if="lockedBy" class="m-0 text-xs text-muted">{{ needsPermissionText(lockedBy) }}</p>
  </fieldset>
</template>
