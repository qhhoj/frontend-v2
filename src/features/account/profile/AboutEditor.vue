<script setup lang="ts">
import { ref } from 'vue';
import { previewComment } from '@/api/comments.api';
import FormField from '@/components/ui/FormField.vue';
import MarkdownEditor from '@/components/ui/MarkdownEditor.vue';
import { profileFieldId } from './profile-field-ids';
import { ABOUT_MAX_LENGTH } from './profile-draft';

/** The about text: the kit Markdown box, its preview rendering what is typed (not the saved text). */
withDefaults(defineProps<{ error?: string }>(), { error: undefined });
const TEXT_ID = profileFieldId('about');
const about = defineModel<string>({ required: true });
const editor = ref<{ showWrite: () => void } | null>(null);
/** The error summary's link to this field: the text must be on screen before it can take the focus. */
defineExpose({ showWriteTab: () => editor.value?.showWrite() });
</script>

<template>
  <FormField :label="$t('settings.profile.fieldName.about')" :input-id="TEXT_ID">
    <MarkdownEditor
      ref="editor"
      v-model="about"
      :input-id="TEXT_ID"
      :label="$t('settings.profile.fieldName.about')"
      :preview="previewComment"
      :max-length="ABOUT_MAX_LENGTH"
      :error="error"
    />
  </FormField>
</template>
