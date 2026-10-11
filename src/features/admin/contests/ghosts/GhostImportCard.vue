<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import { ghostsCsvUrl, importGhosts } from '@/api/contest-ghosts.api';
import type { GhostImport } from '@/api/types/contest-ghosts';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { formatFileSize } from '@/lib/format';
import { useViewerId } from '@/stores/use-viewer-id';
import AdminBit from '../../shell/AdminBit.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import AdminSwitch from '../../ui/AdminSwitch.vue';
import UploadButton from '../../ui/UploadButton.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { CARD, buttonClass } from '../../ui/controls';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import GhostPreviewTable from './GhostPreviewTable.vue';
import {
  GHOST_CSV_MAX_BYTES,
  ghostStatusKey,
  MAX_REPORTED_ISSUES,
  refusedRowsOf,
  unrankedOf,
} from './ghost-import';
import { ghostsKey } from './ghosts.queries';

/**
 * Pick a CSV, preview it (`dryRun`, nothing stored), then replace the whole set. A preview must match what is replaced, so a
 * new file or a changed anonymise choice drops it. Replacing a non-empty set confirms and offers the current CSV first.
 */
const props = defineProps<{ contestKey: string; currentCount: number }>();
const viewerId = useViewerId();
const needsPreviewId = useId();
const pickedFile = ref<File | null>(null);
const csv = ref('');
const isAnonymized = ref(false);
const preview = ref<GhostImport | null>(null);
const isConfirmOpen = ref(false);
const storedCount = ref<number | null>(null);
watch([csv, isAnonymized], () => (preview.value = null));

const bodyOf = (isDryRun: boolean) => ({
  csv: csv.value,
  anonymize: isAnonymized.value,
  dryRun: isDryRun,
});
const previewing = useAdminMutation({
  mutate: () => importGhosts(props.contestKey, bodyOf(true)),
  onDone: (result: GhostImport) => (preview.value = result),
});
const replacing = useAdminMutation({
  mutate: () => importGhosts(props.contestKey, bodyOf(false)),
  invalidates: () => [ghostsKey(viewerId.value, props.contestKey), ['contests', 'replay']],
  onDone: (result: GhostImport) => {
    storedCount.value = result.ghosts.length;
    isConfirmOpen.value = false;
    pickedFile.value = null;
    csv.value = '';
  },
});
const isBusy = computed(() => previewing.isPending.value || replacing.isPending.value);
/** A refused replace is shown by the confirm dialog while it is open, and here once it closes; a new preview clears it. */
const failure = computed(
  () => (isConfirmOpen.value ? null : replacing.failure.value) ?? previewing.failure.value,
);
const refusedRows = computed(() => refusedRowsOf(failure.value));
const failureText = computed(() =>
  failure.value && !refusedRows.value ? failureTextOf(failure.value) : '',
);
const unranked = computed(() => unrankedOf(preview.value?.ghosts ?? []));
const csvUrl = computed(() => ghostsCsvUrl(props.contestKey));

async function onPicked(file: File) {
  pickedFile.value = file;
  storedCount.value = null;
  csv.value = await file.text();
}
function startPreview() {
  replacing.reset();
  void previewing.run(undefined);
}
function startReplace() {
  if (!preview.value) return; // aria-disabled keeps the button focusable, so the click is refused here
  replacing.reset();
  if (props.currentCount > 0) isConfirmOpen.value = true;
  else void replacing.run(undefined);
}
</script>

<template>
  <section data-testid="ghost-import" :class="[CARD, 'flex min-w-0 flex-col gap-5 p-5']">
    <header class="flex flex-col gap-1">
      <h2 class="text-base font-semibold">{{ $t('admin.ghosts.import.title') }}</h2>
      <p class="text-sm text-muted">{{ $t('admin.ghosts.import.lead') }}</p>
    </header>
    <UploadButton
      data-testid="ghost-csv"
      accept=".csv,text/csv"
      :max-bytes="GHOST_CSV_MAX_BYTES"
      :is-pending="isBusy"
      :label="$t('admin.ghosts.import.chooseFile')"
      @picked="onPicked"
    />
    <p v-if="pickedFile" class="text-sm text-muted">
      {{ pickedFile.name }} · {{ formatFileSize(pickedFile.size) }}
    </p>
    <AdminSwitch
      v-model="isAnonymized"
      :label="$t('admin.ghosts.import.anonymize')"
      :description="$t('admin.ghosts.import.anonymizeHint')"
    />
    <div class="flex flex-wrap gap-3">
      <button
        type="button"
        :class="buttonClass('secondary')"
        :disabled="!csv || isBusy"
        @click="startPreview"
      >
        {{ $t('admin.ghosts.import.preview') }}
      </button>
      <button
        type="button"
        :class="buttonClass('primary')"
        :disabled="isBusy"
        :aria-disabled="!preview"
        :aria-describedby="preview ? undefined : needsPreviewId"
        @click="startReplace"
      >
        {{ $t('admin.ghosts.import.replace') }}
      </button>
    </div>
    <p v-if="!preview" :id="needsPreviewId" class="text-sm text-muted">
      {{ $t('admin.ghosts.import.needsPreview') }}
    </p>
    <div
      v-if="refusedRows"
      role="alert"
      class="flex flex-col gap-3 rounded-cell border border-negative bg-surface-solid p-4"
    >
      <p class="flex flex-wrap items-center gap-3 font-semibold">
        <AdminBit placement="refused" />
        {{ $t('admin.ghosts.import.refusedTitle') }}
      </p>
      <p class="text-sm">{{ $t('admin.ghosts.import.refusedRows') }}</p>
      <ul class="list-disc pl-5 font-mono text-sm text-negative">
        <li v-for="(line, index) in refusedRows" :key="index">{{ line }}</li>
      </ul>
      <p v-if="refusedRows.length >= MAX_REPORTED_ISSUES" class="text-sm text-muted">
        {{ $t('admin.ghosts.import.refusedTruncated', { count: MAX_REPORTED_ISSUES }) }}
      </p>
    </div>
    <p v-else-if="failureText" role="alert" class="text-sm text-negative">{{ failureText }}</p>
    <AdminStatus
      v-if="storedCount !== null"
      kind="done"
      :text="$t('admin.ghosts.import.stored', { count: storedCount })"
    />
    <template v-if="preview">
      <h3 class="font-semibold">
        {{ $t('admin.ghosts.preview.title', { count: preview.ghosts.length }) }}
      </h3>
      <div v-if="unranked.length" class="flex flex-col gap-2 rounded-cell border border-line p-4">
        <p class="flex flex-wrap items-center gap-3 text-sm font-semibold">
          <AdminBit placement="refused" />
          {{ $t('admin.ghosts.preview.unranked', { count: unranked.length }) }}
        </p>
        <ul class="flex flex-col gap-1 text-sm">
          <li v-for="ghost in unranked" :key="ghost.label">
            {{ ghost.label }} — {{ $t(ghostStatusKey(ghost)) }}
          </li>
        </ul>
      </div>
      <GhostPreviewTable
        :ghosts="preview.ghosts"
        :label="$t('admin.ghosts.preview.title', { count: preview.ghosts.length })"
      />
    </template>

    <ConfirmDialog
      v-model:visible="isConfirmOpen"
      :title="$t('admin.ghosts.import.confirmTitle', { count: currentCount })"
      :confirm-label="$t('admin.ghosts.import.confirm')"
      tone="danger"
      :busy="replacing.isPending.value"
      @confirm="replacing.run(undefined)"
    >
      <p class="text-muted">
        {{ $t('admin.ghosts.import.confirmBody', { next: preview?.ghosts.length ?? 0 }) }}
      </p>
      <a
        :href="csvUrl"
        download
        class="inline-flex min-h-11 items-center font-semibold text-accent-text underline"
        >{{ $t('admin.ghosts.import.download') }}</a
      >
      <template #error>
        <p v-if="replacing.failure.value" role="alert" class="text-sm text-negative">
          {{ failureTextOf(replacing.failure.value) }}
        </p>
      </template>
    </ConfirmDialog>
  </section>
</template>
