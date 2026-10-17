<script setup lang="ts">
import AuthField from '@/features/auth/AuthField.vue';
import { ref } from 'vue';
import AboutEditor from './AboutEditor.vue';
import LengthCounter from './LengthCounter.vue';
import { profileFieldId } from './profile-field-ids';
import { FIRST_NAME_MAX_LENGTH, storedLength } from './profile-draft';

/** Board SetProfile, first card: the public name, then the default slot (the submit defaults), then the about text. */
defineProps<{ username: string; savedAboutHtml: string; errors: Record<string, string> }>();
const firstName = defineModel<string>('firstName', { required: true });
const about = defineModel<string>('about', { required: true });
const aboutEditor = ref<{ showWriteTab: () => void } | null>(null);
defineExpose({ showAboutWriteTab: () => aboutEditor.value?.showWriteTab() });
</script>

<template>
  <AuthField
    :id="profileFieldId('firstName')"
    v-model="firstName"
    name="firstName"
    class="scroll-mb-28"
    autocomplete="nickname"
    :label="$t('settings.profile.fieldName.firstName')"
    :hint="$t('settings.profile.firstNameHint', { username })"
    :error="errors.firstName"
  >
    <template #label-end>
      <LengthCounter :used="storedLength(firstName)" :max="FIRST_NAME_MAX_LENGTH" />
    </template>
  </AuthField>
  <slot />
  <AboutEditor
    ref="aboutEditor"
    v-model="about"
    :saved-html="savedAboutHtml"
    :error="errors.about"
  />
</template>
