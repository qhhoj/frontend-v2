<script setup lang="ts">
import { computed, useId } from 'vue';
import { usePermissions } from '@/stores/use-permissions';
import { needsPermissionText } from '../../ui/permission-text';

/**
 * A setting saved with the form (pages/admin.md: a checkbox, not a switch): the box, a bold label and an optional
 * one-line description. `lockedBy` (a permission codename) disables it and names the permission in words; superusers see
 * the codename as a tooltip.
 */
const model = defineModel<boolean>({ required: true });
const props = defineProps<{
  label: string;
  description?: string;
  lockedBy?: string;
  inputId?: string;
}>();
const generatedId = useId();
const id = computed(() => props.inputId ?? generatedId);
const { isSuperuser } = usePermissions();
</script>

<template>
  <div class="flex items-start gap-3">
    <input
      :id="id"
      v-model="model"
      type="checkbox"
      class="mt-0.5 size-4 shrink-0 accent-[var(--qh-accent)] pointer-coarse:size-5"
      :disabled="Boolean(lockedBy)"
      :aria-describedby="description || lockedBy ? `${id}-text` : undefined"
    />
    <div class="flex min-w-0 flex-col">
      <label :for="id" class="text-sm font-semibold" :class="lockedBy && 'text-muted'">{{
        label
      }}</label>
      <span v-if="description || lockedBy" :id="`${id}-text`" class="text-sm text-muted">
        <template v-if="description">{{ description }}</template>
        <span v-if="lockedBy" class="block text-xs" :title="isSuperuser ? lockedBy : undefined">{{
          needsPermissionText(lockedBy)
        }}</span>
      </span>
    </div>
  </div>
</template>
