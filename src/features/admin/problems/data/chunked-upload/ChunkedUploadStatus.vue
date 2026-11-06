<script setup lang="ts">
import { computed } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import Notice from '@/components/ui/Notice.vue';
import ProgressBar from '@/components/ui/ProgressBar.vue';
import { translate } from '@/i18n';
import { formatFileSize } from '@/lib/format';
import type { ChunkedPhase } from './use-chunked-upload';

/** A large archive's progress while it runs (phase, percent, bytes, chunk, Hủy), or, once it stopped, what is kept and how to go on. */
const props = defineProps<{
  phase: ChunkedPhase | null;
  doneBytes: number;
  totalBytes: number;
  /** 1-based chunk being sent, of `chunkCount`. */
  chunkNumber: number;
  chunkCount: number;
  /** Cancel was refused because the server is storing the archive: no Hủy, a notice, the outcome follows. */
  finishing: boolean;
  /** The file of an upload that stopped with its session kept; null when nothing waits. */
  interruptedName: string | null;
}>();
const emit = defineEmits<{ cancel: []; resume: [] }>();
const percent = computed(() =>
  props.totalBytes > 0 ? Math.floor((props.doneBytes / props.totalBytes) * 100) : 0,
);
const phaseText = computed(() =>
  props.phase ? translate(`admin.problems.data.chunked.${props.phase}`) : '',
);
/** What a screen reader hears: the phase, then every tenth percent, never each slice. */
const announcement = computed(() => {
  if (!props.phase) return '';
  if (props.finishing) return translate('admin.problems.data.chunked.finishing');
  if (props.phase === 'completing') return phaseText.value;
  return `${phaseText.value} ${Math.floor(percent.value / 10) * 10}%`;
});
</script>

<template>
  <p class="sr-only" aria-live="polite">{{ announcement }}</p>
  <div v-if="phase" class="flex flex-col gap-2" data-testid="chunked-upload-progress">
    <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span>
        {{ phaseText }}
        <span v-if="phase !== 'completing'" class="font-mono tabular-nums text-muted">
          {{ percent }}% · {{ formatFileSize(doneBytes) }} / {{ formatFileSize(totalBytes) }}
          <template v-if="phase === 'uploading' && chunkCount > 1">
            ·
            {{
              $t('admin.problems.data.chunked.chunk', { number: chunkNumber, count: chunkCount })
            }}
          </template>
        </span>
      </span>
      <AppButton v-if="!finishing" size="sm" tone="secondary" @click="emit('cancel')">
        {{ $t('common.cancel') }}
      </AppButton>
    </div>
    <Notice v-if="finishing" tone="info" compact data-testid="chunked-upload-finishing">
      {{ $t('admin.problems.data.chunked.finishing') }}
    </Notice>
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
