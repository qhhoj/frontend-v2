<script setup lang="ts">
import { computed } from 'vue';
import { JOIN_REASON_MAX_LENGTH } from '@/api/types/organizations';
import AppButton from '@/components/ui/AppButton.vue';
import FormField from '@/components/ui/FormField.vue';
import TextArea from '@/components/ui/TextArea.vue';

/** The reason for a join request: `v-model` holds the text, `submit` fires only with a non-blank reason. */
const props = defineProps<{ busy: boolean }>();
const reason = defineModel<string>({ required: true });
const emit = defineEmits<{ submit: [] }>();
const canSend = computed(() => reason.value.trim() !== '' && !props.busy);
const send = () => {
  if (canSend.value) emit('submit');
};
</script>

<template>
  <form class="flex flex-col gap-3" @submit.prevent="send">
    <FormField :label="$t('orgMembership.reason')">
      <TextArea v-model="reason" :maxlength="JOIN_REASON_MAX_LENGTH" rows="4" class="min-h-24" />
    </FormField>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <span class="text-sm text-muted">{{ reason.length }} / {{ JOIN_REASON_MAX_LENGTH }}</span>
      <AppButton type="submit" tone="primary" :disabled="!canSend" :loading="busy">
        {{ $t('orgMembership.send') }}
      </AppButton>
    </div>
  </form>
</template>
