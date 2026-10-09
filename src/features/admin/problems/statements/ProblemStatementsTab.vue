<script setup lang="ts">
import { computed, ref } from 'vue';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import type { EditableProblem, ProblemEditingMeta } from '@/api/types/problem-editing';
import AdminBit from '../../shell/AdminBit.vue';
import AdminField from '../../ui/AdminField.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureReasonOf } from '../failure-reason';
import { IMAGE_ACCEPT, IMAGE_MAX_BYTES } from '../limits';
import { ADMIN_BUTTON_CLASS, ADMIN_INPUT_CLASS, ADMIN_PRIMARY_CLASS } from '../../ui/classes';
import MarkdownField from '../../ui/MarkdownField.vue';
import UploadButton from '../../ui/UploadButton.vue';
import { STATEMENT_SLOTS } from './statement-drafts';
import { useImageInsert } from './use-image-insert';
import { useDraftLeaveGuard } from '../drafts/use-draft-leave-guard';
import DraftLeaveDialog from '../drafts/DraftLeaveDialog.vue';
import { FULL_MARKUP_PERMISSION, useStatementDrafts } from './use-statement-drafts';

const props = defineProps<{ problem: EditableProblem; meta: ProblemEditingMeta }>();
const root = ref<HTMLElement>();
const {
  slot,
  drafts,
  current,
  isLocked,
  isDirty,
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
const { isLeaveOpen, leaveAnyway } = useDraftLeaveGuard(() => isDirty.value);
const isFullMarkupHidden = computed(() => props.problem.isFullMarkup && !canFullMarkup.value);
const slotName = computed(() => `admin.problems.statements.slots.${slot.value}`);
</script>

<template>
  <div ref="root" class="flex flex-col gap-5">
    <SettingsCard
      :title="$t('admin.problems.statements.title')"
      :lead="$t('admin.problems.statements.lead')"
    >
      <template #header-end>
        <AdminBit placement="composing" />
      </template>
      <div
        role="radiogroup"
        :aria-label="$t('admin.problems.statements.slotsLabel')"
        class="flex flex-wrap gap-2"
      >
        <button
          v-for="item in STATEMENT_SLOTS"
          :key="item"
          type="button"
          role="radio"
          :data-slot="item"
          :aria-checked="slot === item"
          class="inline-flex min-h-11 items-center gap-2 rounded-pill border px-4 text-sm font-semibold"
          :class="
            slot === item
              ? 'border-accent bg-accent-soft text-accent-soft-text'
              : 'border-line-strong text-content hover:bg-surface-hover'
          "
          @click="slot = item"
        >
          {{ $t(`admin.problems.statements.slots.${item}`) }}
          <span v-if="item !== 'original' && !drafts[item].exists" class="text-xs text-muted">
            {{ $t('admin.problems.statements.missing') }}
          </span>
        </button>
      </div>
      <AdminField
        v-if="slot !== 'original'"
        v-slot="{ id, describedBy }"
        input-id="statement-name"
        :label="$t('admin.problems.statements.nameLabel', { language: $t(slotName) })"
        :hint="$t('admin.problems.statements.nameHint')"
        :error="errors.name"
      >
        <input
          :id="id"
          v-model="current.name"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="errors.name ? 'true' : undefined"
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
          <UploadButton
            :label="$t('admin.problems.statements.imageButton')"
            :accept="IMAGE_ACCEPT"
            :max-bytes="IMAGE_MAX_BYTES"
            :is-pending="imageMutation.isPending.value"
            @picked="imageMutation.upload"
          />
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
      <div class="flex flex-wrap items-center gap-3">
        <AdminStatus
          v-if="saveMutation.failure.value"
          kind="refused"
          :text="failureReasonOf(saveMutation.failure.value)"
        />
        <AdminStatus
          v-else-if="saveMutation.isDone.value"
          kind="done"
          :text="$t('admin.ui.saved')"
        />
        <p v-if="isLocked" id="statement-original-lock" class="text-sm text-muted">
          {{ $t('admin.ui.needsPermission', { permission: FULL_MARKUP_PERMISSION }) }}
        </p>
        <div class="ml-auto flex flex-wrap gap-2">
          <button type="button" :class="ADMIN_BUTTON_CLASS" @click="discard">
            {{ $t('admin.problems.statements.discard') }}
          </button>
          <button
            type="button"
            :class="ADMIN_PRIMARY_CLASS"
            :aria-disabled="isLocked || saveMutation.isPending.value ? 'true' : undefined"
            :aria-describedby="isLocked ? 'statement-original-lock' : undefined"
            @click="save"
          >
            {{ $t(`admin.problems.statements.save.${slot}`) }}
          </button>
        </div>
      </div>
    </SettingsCard>
    <DraftLeaveDialog v-model:visible="isLeaveOpen" @leave="leaveAnyway" />
  </div>
</template>
