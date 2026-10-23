<script setup lang="ts">
import { computed } from 'vue';
import SaveBar from '@/components/ui/SaveBar.vue';
import type { SaveBarProps } from '@/components/ui/SaveBar.props';

/**
 * The admin forms' save bar: `SaveBar` as is (`#status` and `#actions` pass through). On a phone the page bar hides while
 * idle (nothing to save, nothing to say), unless the form can be saved clean (`allowClean`, a create form) or the bar is a
 * dialog or drawer footer.
 */
const props = withDefaults(defineProps<SaveBarProps>(), { hideIdleOnPhone: undefined });
const emit = defineEmits<{ discard: [] }>();
const hidesIdleOnPhone = computed(
  () => props.hideIdleOnPhone ?? (!props.allowClean && props.variant !== 'footer'),
);
</script>

<template>
  <SaveBar v-bind="props" :hide-idle-on-phone="hidesIdleOnPhone" @discard="emit('discard')">
    <template v-for="(_, name) in $slots" #[name]><slot :name="name" /></template>
  </SaveBar>
</template>
