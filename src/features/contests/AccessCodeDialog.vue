<script setup lang="ts">
import { ref, watch } from 'vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import InlineBit from '@/components/InlineBit.vue';
import { errorMessageKey } from '@/i18n/error-message';

const props = defineProps<{
  actionLabel: string;
  contestName: string;
  isPending: boolean;
  error: unknown;
}>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ submit: [code: string] }>();
/** The code lives only in this field: it is cleared as soon as the dialog closes, never kept or logged. */
const code = ref('');
const INPUT_ID = 'contest-access-code';

watch(visible, (isOpen) => {
  if (!isOpen) code.value = '';
});
function submit() {
  if (!props.isPending) emit('submit', code.value.trim());
}
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t('contests.actions.codeTitle')"
    :body="$t('contests.actions.codeBody', { name: contestName })"
    :confirm-label="actionLabel"
    :busy="isPending"
    :can-confirm="code.trim() !== ''"
    @confirm="submit"
  >
    <!-- PrimeVue focuses the first [autofocus] field after the open transition; without it the close button gets focus. -->
    <label :for="INPUT_ID" class="text-caption font-semibold tracking-wider text-muted uppercase">
      {{ $t('contests.actions.codeLabel') }}
    </label>
    <input
      :id="INPUT_ID"
      v-model="code"
      autofocus
      type="password"
      autocomplete="new-password"
      maxlength="255"
      aria-describedby="contest-access-code-hint"
      class="min-h-11 rounded-pill border border-line-strong bg-surface-strong px-4"
    />
    <p id="contest-access-code-hint" class="text-sm text-muted">
      {{ $t('contests.actions.codeHint') }}
    </p>
    <template #error>
      <p v-if="error" role="alert" class="flex items-center gap-2.5 text-verdict-wa">
        <InlineBit kind="sweat" />
        <span>{{ $t(errorMessageKey(error)) }}</span>
      </p>
    </template>
  </ConfirmDialog>
</template>
