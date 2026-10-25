<script setup lang="ts">
import { computed, useId } from 'vue';
import { usePermissions } from '@/stores/use-permissions';
import { needsPermissionText } from '../permission-text';

/**
 * An on/off field of a form saved later (the switch, `AdminSwitch`, is for settings that apply at once): a checkbox, its
 * label and an optional one-line description. `lockedBy` (a permission codename) disables it and says which permission
 * in words; superusers see the codename as a tooltip.
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
const lockedText = computed(() => (props.lockedBy ? needsPermissionText(props.lockedBy) : ''));
const describedBy = computed(
  () =>
    [props.description && `${id.value}-desc`, props.lockedBy && `${id.value}-locked`]
      .filter(Boolean)
      .join(' ') || undefined,
);
</script>

<template>
  <div class="flex items-start gap-3">
    <input
      :id="id"
      v-model="model"
      type="checkbox"
      class="mt-0.5 size-5 shrink-0 accent-accent disabled:cursor-not-allowed"
      :disabled="!!lockedBy"
      :aria-describedby="describedBy"
    />
    <div class="flex min-w-0 flex-col">
      <label :for="id" class="text-sm font-semibold" :class="lockedBy && 'text-muted'">{{
        label
      }}</label>
      <span v-if="description" :id="`${id}-desc`" class="text-sm text-muted">{{
        description
      }}</span>
      <span
        v-if="lockedBy"
        :id="`${id}-locked`"
        class="text-caption leading-4 text-muted"
        :title="isSuperuser ? lockedBy : undefined"
      >
        {{ lockedText }}
      </span>
    </div>
  </div>
</template>
