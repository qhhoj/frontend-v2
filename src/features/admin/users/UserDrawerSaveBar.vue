<script setup lang="ts">
import AdminSaveBar from '../ui/form/AdminSaveBar.vue';
import type { DrawerForm } from './drawer-form';

/**
 * `AdminSaveBar` inside the drawer footer: the footer is already fixed, padded and ruled, so the bar's sticky page frame
 * is switched off.
 */
defineProps<{ form: DrawerForm }>();
const IN_FOOTER = {
  position: 'static',
  margin: '0',
  padding: '0',
  borderTopWidth: '0',
  flex: '1 1 auto',
};
</script>

<template>
  <AdminSaveBar
    :style="IN_FOOTER"
    :form="form.formId"
    :save-label="form.saveLabel"
    :dirty-count="form.dirtyCount"
    :pending="form.isPending"
    :saved-at="form.savedAt"
    @discard="form.discard()"
  />
</template>
