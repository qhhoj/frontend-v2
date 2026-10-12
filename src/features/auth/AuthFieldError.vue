<script setup lang="ts">
import FormFieldError from '@/components/ui/FormFieldError.vue';

/** The error line under an auth field; its `id` is the one the field's `aria-describedby` names. */
defineProps<{ id: string; message: string }>();
</script>

<template>
  <FormFieldError :id="id" :message="message" />
</template>
