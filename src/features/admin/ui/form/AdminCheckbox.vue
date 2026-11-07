<script setup lang="ts">
import { computed } from 'vue';
import Checkbox from '@/components/ui/Checkbox.vue';
import { usePermissions } from '@/stores/use-permissions';
import { needsPermissionText } from '../permission-text';

/**
 * The kit `Checkbox` plus `lockedBy` (a permission codename): it disables the box and says which permission in words;
 * superusers see the codename as a tooltip.
 */
const model = defineModel<boolean>({ required: true });
const props = defineProps<{
  label: string;
  description?: string;
  lockedBy?: string;
  inputId?: string;
}>();
const { isSuperuser } = usePermissions();
const lockedText = computed(() => (props.lockedBy ? needsPermissionText(props.lockedBy) : ''));
</script>

<template>
  <div class="flex flex-col">
    <Checkbox
      v-model="model"
      :label="label"
      :description="description"
      :disabled="!!lockedBy"
      :input-id="inputId"
    />
    <span
      v-if="lockedBy"
      class="pl-8 text-caption leading-4 text-muted"
      :title="isSuperuser ? lockedBy : undefined"
    >
      {{ lockedText }}
    </span>
  </div>
</template>
