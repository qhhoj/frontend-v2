<script setup lang="ts">
import { computed, ref } from 'vue';
import type { EditableProblem, ProblemEditingMeta } from '@/api/types/problem-editing';
import AdminField from '../../ui/AdminField.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { CARD, INPUT } from '../../ui/controls';
import AdminLeaveGuard from '../../ui/form/AdminLeaveGuard.vue';
import AdminSaveBar from '../../ui/form/AdminSaveBar.vue';
import MarkdownField from '../../ui/MarkdownField.vue';
import { needsPermissionText } from '../../ui/permission-text';
import UploadButton from '../../ui/UploadButton.vue';
import { failureReasonOf } from '../failure-reason';
import { IMAGE_ACCEPT, IMAGE_MAX_BYTES } from '../limits';
import { STATEMENT_SLOTS } from './statement-drafts';
import { useImageInsert } from './use-image-insert';
import { FULL_MARKUP_PERMISSION, useStatementDrafts } from './use-statement-drafts';

/** One language at a time (segmented control), name + Markdown with a live preview, and a per-language save in the bar. */
const props = defineProps<{ problem: EditableProblem; meta: ProblemEditingMeta }>();
const root = ref<HTMLElement>();
const {
  slot,
  drafts,
  current,
  isLocked,
  dirtyCount,
  totalDirtyCount,
  savedAt,
  previewStyle,
  canFullMarkup,
  errors,
  save,
  discard,
  saveMutation,
} = useStatementDrafts(() => props.problem);
const imageMutation = useImageInsert(
  drafts,
  slot,
  () => root.value?.querySelector('textarea') ?? undefined,
);
const isFullMarkupHidden = computed(() => props.problem.isFullMarkup && !canFullMarkup.value);
const slotName = computed(() => `admin.problems.statements.slots.${slot.value}`);
const lockText = computed(() =>
  isLocked.value ? needsPermissionText(FULL_MARKUP_PERMISSION) : undefined,
);
const SEGMENT =
  'inline-flex min-h-8 items-center gap-1.5 rounded-pill px-3 text-sm font-semibold whitespace-nowrap text-muted hover:text-content pointer-coarse:min-h-10 aria-checked:bg-accent-soft aria-checked:text-accent-soft-text';
</script>

<template>
  <form ref="root" class="flex flex-col gap-4" novalidate @submit.prevent="save">
    <div :class="[CARD, 'flex flex-col gap-4 p-4 sm:p-5']">
      <div
        role="radiogroup"
        :aria-label="$t('admin.problems.statements.slotsLabel')"
        class="flex max-w-full flex-wrap gap-1 self-start rounded-pill border border-line bg-surface-strong p-1"
      >
        <button
          v-for="item in STATEMENT_SLOTS"
          :key="item"
          type="button"
          role="radio"
          :data-slot="item"
          :aria-checked="slot === item"
          :class="SEGMENT"
          @click="slot = item"
        >
          {{ $t(`admin.problems.statements.slots.${item}`) }}
          <span v-if="item !== 'original' && !drafts[item].exists" class="text-xs font-normal">
            ({{ $t('admin.problems.statements.missing') }})
          </span>
        </button>
      </div>
      <AdminField
        v-if="slot !== 'original'"
        v-slot="{ id, describedBy, invalid }"
        class="max-w-xl"
        input-id="statement-name"
        :label="$t('admin.problems.statements.nameLabel', { language: $t(slotName) })"
        :hint="$t('admin.problems.statements.nameHint')"
        :error="errors.name"
      >
        <input
          :id="id"
          v-model="current.name"
          :class="INPUT"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
        />
      </AdminField>
      <MarkdownField
        v-model="current.description"
        :label="$t('admin.problems.statements.contentLabel')"
        :preview-style="previewStyle"
        :hint="$t('admin.problems.statements.imageHint')"
        :error="errors.description"
      >
        <template #toolbar>
          <div class="flex">
            <UploadButton
              :label="$t('admin.problems.statements.imageButton')"
              :accept="IMAGE_ACCEPT"
              :max-bytes="IMAGE_MAX_BYTES"
              :is-pending="imageMutation.isPending.value"
              @picked="imageMutation.upload"
            />
          </div>
        </template>
      </MarkdownField>
      <AdminStatus
        v-if="imageMutation.failure.value"
        kind="refused"
        :text="failureReasonOf(imageMutation.failure.value)"
      />
      <p v-if="isFullMarkupHidden" class="text-sm text-muted">
        {{ $t('admin.problems.statements.fullMarkupNote') }}
      </p>
    </div>
    <AdminStatus
      v-if="saveMutation.failure.value"
      kind="refused"
      :text="failureReasonOf(saveMutation.failure.value)"
    />
    <AdminSaveBar
      data-testid="statement-save-bar"
      :dirty-count="dirtyCount"
      :pending="saveMutation.isPending.value"
      :saved-at="savedAt"
      :blocked-reason="lockText"
      :save-label="$t(`admin.problems.statements.save.${slot}`)"
      @discard="discard"
    />
    <AdminLeaveGuard :dirty-count="totalDirtyCount" />
  </form>
</template>
