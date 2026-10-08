<script setup lang="ts">
import Dialog from 'primevue/dialog';
import { ref, watch } from 'vue';
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
const input = ref<HTMLInputElement | null>(null);
const INPUT_ID = 'contest-access-code';

watch(visible, (isOpen) => {
  if (!isOpen) code.value = '';
});
function submit() {
  if (!props.isPending) emit('submit', code.value.trim());
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="$t('contests.actions.codeTitle')"
    :draggable="false"
    @show="input?.focus()"
  >
    <form class="flex flex-col gap-3" @submit.prevent="submit">
      <p class="text-muted">{{ $t('contests.actions.codeBody', { name: contestName }) }}</p>
      <label :for="INPUT_ID" class="text-[12px] font-semibold tracking-wider text-muted uppercase">
        {{ $t('contests.actions.codeLabel') }}
      </label>
      <input
        :id="INPUT_ID"
        ref="input"
        v-model="code"
        type="password"
        autocomplete="off"
        required
        maxlength="255"
        aria-describedby="contest-access-code-hint"
        class="min-h-11 rounded-pill border border-line-strong bg-surface-strong px-4"
      />
      <p id="contest-access-code-hint" class="text-sm text-muted">
        {{ $t('contests.actions.codeHint') }}
      </p>
      <p v-if="error" role="alert" class="flex items-center gap-2.5 text-verdict-wa">
        <InlineBit kind="sweat" />
        <span>{{ $t(errorMessageKey(error)) }}</span>
      </p>
      <div class="flex justify-end gap-2.5">
        <button
          type="button"
          class="min-h-11 rounded-pill border border-line px-5 font-semibold hover:bg-surface-hover"
          @click="visible = false"
        >
          {{ $t('contests.actions.cancel') }}
        </button>
        <button
          type="submit"
          :aria-disabled="isPending || undefined"
          class="min-h-11 rounded-pill bg-gradient-accent px-5 font-semibold text-on-accent"
        >
          {{ actionLabel }}
        </button>
      </div>
    </form>
  </Dialog>
</template>
