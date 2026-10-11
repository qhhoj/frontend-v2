<script setup lang="ts">
import { computed } from 'vue';
import { ExternalLink, FileText, Image, Package } from 'lucide-vue-next';
import CopyButton from '@/components/CopyButton.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { CARD } from '../../ui/controls';
import { needsPermissionText } from '../../ui/permission-text';
import UploadButton from '../../ui/UploadButton.vue';
import { failureReasonOf } from '../failure-reason';
import { useProblemUpload } from './use-problem-upload';
import type { ProblemUploadKind } from './use-problem-upload';

/**
 * One upload tile: what it holds now (file name, open link, copy address), then "Tải lên" or "Thay". An image tile holds
 * nothing (each upload only returns an address to paste into the statement). A locked tile names the permission instead.
 */
const props = defineProps<{
  kind: ProblemUploadKind;
  code: string;
  testId: string;
  title: string;
  lead: string;
  accept: string;
  maxBytes?: number;
  /** The permission codename a locked tile needs. */
  lockedBy?: string;
  /** The address the problem stores now; undefined for a tile that keeps no file (images). */
  currentUrl?: string | null;
}>();
const upload = useProblemUpload(props.kind, () => props.code);
const ICONS = { image: Image, pdf: FileText, material: Package } as const;
const shownUrl = computed(() => upload.url.value || props.currentUrl || '');
const fileName = computed(() => shownUrl.value.split('/').pop() ?? '');
const keepsFile = computed(() => props.currentUrl !== undefined);
const buttonKey = computed(() =>
  keepsFile.value && shownUrl.value
    ? 'admin.problems.files.replace'
    : 'admin.problems.files.upload',
);
</script>

<template>
  <section :data-testid="testId" :class="[CARD, 'flex flex-col gap-3 p-4 sm:p-5']">
    <header class="flex items-start gap-3">
      <span
        aria-hidden="true"
        class="flex size-9 shrink-0 items-center justify-center rounded-cell bg-surface-strong text-muted"
      >
        <component :is="ICONS[kind]" class="size-[18px]" :stroke-width="1.75" />
      </span>
      <div class="min-w-0">
        <h2 class="font-display text-base font-semibold">{{ title }}</h2>
        <p class="text-sm text-muted">{{ lead }}</p>
      </div>
    </header>
    <div
      v-if="keepsFile || upload.url.value"
      class="flex min-h-11 flex-wrap items-center gap-2 rounded-cell border border-line px-3 py-2 text-sm"
    >
      <template v-if="shownUrl">
        <span class="min-w-0 flex-1 truncate font-mono" :title="shownUrl">{{ fileName }}</span>
        <a
          v-if="keepsFile"
          :href="shownUrl"
          target="_blank"
          rel="noopener"
          class="inline-flex min-h-8 items-center gap-1 font-semibold text-accent-text hover:underline"
        >
          {{ $t('admin.problems.files.open') }}
          <ExternalLink aria-hidden="true" class="size-3.5" :stroke-width="1.75" />
        </a>
        <CopyButton :text="shownUrl" :label="$t('admin.problems.files.copy')" />
      </template>
      <span v-else class="text-muted">{{ $t('admin.problems.files.none') }}</span>
    </div>
    <p v-if="lockedBy" class="text-sm text-muted">{{ needsPermissionText(lockedBy) }}</p>
    <UploadButton
      v-else
      class="mt-auto"
      :label="$t(buttonKey)"
      :accept="accept"
      :max-bytes="maxBytes"
      :is-pending="upload.mutation.isPending.value"
      @picked="upload.mutation.run"
    />
    <AdminStatus
      v-if="upload.mutation.failure.value"
      kind="refused"
      :text="failureReasonOf(upload.mutation.failure.value)"
    />
  </section>
</template>
