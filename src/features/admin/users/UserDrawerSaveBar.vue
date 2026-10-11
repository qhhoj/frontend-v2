<script setup lang="ts">
import AdminSaveBar from '../ui/form/AdminSaveBar.vue';
import type { DrawerForm } from './drawer-form';

/** `AdminSaveBar` in the drawer footer, which already pins, pads and rules the row. */
defineProps<{ form: DrawerForm }>();
</script>

<template>
  <AdminSaveBar
    variant="footer"
    :form="form.formId"
    :save-label="form.saveLabel"
    :dirty-count="form.dirtyCount"
    :pending="form.isPending"
    :saved-at="form.savedAt"
    @discard="form.discard()"
  />
</template>
