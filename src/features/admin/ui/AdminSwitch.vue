<script setup lang="ts">
import { computed } from 'vue';
import Switch from '@/components/ui/Switch.vue';
import { usePermissions } from '@/stores/use-permissions';
import { needsPermissionText } from './permission-text';

/**
 * The admin `Switch`: `lockedBy` (a permission codename) disables it and says which permission in words under the
 * description; superusers see the codename as a tooltip.
 */
const model = defineModel<boolean>({ required: true });
const props = defineProps<{ label: string; description?: string; lockedBy?: string }>();
const { isSuperuser } = usePermissions();
const lockedText = computed(() => (props.lockedBy ? needsPermissionText(props.lockedBy) : ''));
</script>

<template>
  <Switch v-model="model" :label="label" :description="description" :disabled="Boolean(lockedBy)">
    <template v-if="lockedBy" #note>
      <span :title="isSuperuser ? lockedBy : undefined">{{ lockedText }}</span>
    </template>
  </Switch>
</template>
