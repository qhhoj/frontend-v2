<script setup lang="ts">
import { computed } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import Notice from '@/components/ui/Notice.vue';
import ProgressBar from '@/components/ui/ProgressBar.vue';
import { translate } from '@/i18n';
import { formatFileSize } from '@/lib/format';
import type { ChunkedPhase } from './use-chunked-upload';

/** A large archive's progress while it runs (phase, percent, bytes, Hủy), or, once it stopped, what is kept and how to go on. */
const props = defineProps<{
  phase: ChunkedPhase | null;
  doneBytes: number;
  totalBytes: number;
  /** The file of an upload that stopped on a lasting failure; null when nothing waits. */
  interruptedName: string | null;
}>();
const emit = defineEmits<{ cancel: []; resume: [] }>();
const percent = computed(() =>
  props.totalBytes > 0 ? Math.floor((props.doneBytes / props.totalBytes) * 100) : 0,
);
const phaseText = computed(() =>
  props.phase ? translate(`admin.problems.data.chunked.${props.phase}`) : '',
);
</script>

<template>
  <div v-if="phase" class="flex flex-col gap-2" data-testid="chunked-upload-progress">
    <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span role="status">
        {{ phaseText }}
        <span v-if="phase !== 'completing'" class="font-mono tabular-nums text-muted">
          {{ percent }}% · {{ formatFileSize(doneBytes) }} / {{ formatFileSize(totalBytes) }}
        </span>
      </span>
      <AppButton v-if="phase !== 'completing'" size="sm" tone="secondary" @click="emit('cancel')">
        {{ $t('common.cancel') }}
      </AppButton>
    </div>
    <ProgressBar
      :value="phase === 'completing' ? 100 : percent"
      :label="$t('admin.problems.data.chunked.progressLabel')"
    />
  </div>
  <Notice
    v-else-if="interruptedName"
    tone="warning"
    compact
    data-testid="chunked-upload-interrupted"
  >
    {{ $t('admin.problems.data.chunked.interrupted', { name: interruptedName }) }}
    <template #action>
      <div class="flex gap-2">
        <AppButton size="sm" tone="secondary" @click="emit('cancel')">
          {{ $t('common.cancel') }}
        </AppButton>
        <AppButton size="sm" tone="primary" @click="emit('resume')">
          {{ $t('admin.problems.data.chunked.resume') }}
        </AppButton>
      </div>
    </template>
  </Notice>
</template>
