<script setup lang="ts">
import AuthField from '@/features/auth/AuthField.vue';
import AboutEditor from './AboutEditor.vue';
import LengthCounter from './LengthCounter.vue';
import { FIRST_NAME_MAX_LENGTH } from './profile-draft';

/** Board SetProfile, first card: the public name and the about text. */
defineProps<{ username: string; savedAboutHtml: string; errors: Record<string, string> }>();
const firstName = defineModel<string>('firstName', { required: true });
const about = defineModel<string>('about', { required: true });
</script>

<template>
  <AuthField
    v-model="firstName"
    name="firstName"
    autocomplete="nickname"
    :label="$t('settings.profile.fieldName.firstName')"
    :hint="$t('settings.profile.firstNameHint', { username })"
    :error="errors.firstName"
  >
    <template #label-end>
      <LengthCounter :used="firstName.length" :max="FIRST_NAME_MAX_LENGTH" />
    </template>
  </AuthField>
  <AboutEditor v-model="about" :saved-html="savedAboutHtml" :error="errors.about" />
</template>
