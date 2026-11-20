<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { EditableProblem, ProblemEditingMeta } from '@/api/types/problem-editing';
import Card from '@/components/ui/Card.vue';
import Disclosure from '@/components/ui/Disclosure.vue';
import FormField from '@/components/ui/FormField.vue';
import Notice from '@/components/ui/Notice.vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import TextInput from '@/components/ui/TextInput.vue';
import UploadButton from '@/components/ui/UploadButton.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import MarkdownField from '../../ui/MarkdownField.vue';
import { needsPermissionText } from '../../ui/permission-text';
import EditorialFields from '../editorial/EditorialFields.vue';
import { failureReasonOf } from '../failure-reason';
import ProblemFiles from '../files/ProblemFiles.vue';
import { IMAGE_ACCEPT, IMAGE_MAX_BYTES } from '../limits';
import StatementTrust from '../statements/StatementTrust.vue';
import { STATEMENT_SLOTS } from '../statements/statement-drafts';
import { useImageInsert } from '../statements/use-image-insert';
import { FULL_MARKUP_PERMISSION } from '../statements/use-statement-drafts';
import type { Workbench } from './use-workbench';

/**
 * Section 2: everything a statement is made of, in one place. The statement itself, one language at a time (name and
 * Markdown with a live preview, images inserted in place); then two folds: the PDF, image and material uploads, and the
 * editorial. Uploads and the trust switch apply at once; the texts wait for the page's save.
 */
const props = defineProps<{
  problem: EditableProblem;
  meta: ProblemEditingMeta;
  statements: Workbench['statements'];
  editorial: Workbench['editorial'];
}>();
const { t } = useI18n();
const KEY = 'admin.problems.statements';
const {
  slot,
  drafts,
  current,
  isLocked,
  changesBySlot,
  previewStyle,
  canFullMarkup,
  errors,
  canSetTrust,
  setTrust,
  trustMutation,
} = props.statements;
const { draft: editorialDraft, contentError } = props.editorial;
const root = ref<HTMLElement>();
const imageMutation = useImageInsert(
  drafts,
  slot,
  () => root.value?.querySelector('textarea') ?? undefined,
);
/** Each slot says what a teacher must know before switching: a translation not written yet, edits not saved yet. */
const slotOptions = computed(() =>
  STATEMENT_SLOTS.map((item) => ({
    value: item,
    label: t(`${KEY}.slots.${item}`),
    testid: `statement-slot-${item}`,
    badge: item !== 'original' && !drafts.value[item].exists ? t(`${KEY}.missing`) : undefined,
    dot:
      changesBySlot.value[item] > 0
        ? { tone: 'accent' as const, label: t(`${KEY}.unsaved`) }
        : undefined,
  })),
);
const slotName = computed(() => t(`${KEY}.slots.${slot.value}`));
const isFullMarkupHidden = computed(
  () => props.problem.isFullMarkup && current.value.isMarkupTrusted && !canFullMarkup.value,
);
/** Trust shows for a written slot that is trusted or on a full-markup problem (where it decides the render). */
const isTrustShown = computed(
  () => current.value.exists && (props.problem.isFullMarkup || current.value.isMarkupTrusted),
);
const trustBlockedReason = computed(() =>
  canSetTrust.value ? undefined : t(`${KEY}.trust.unsavedReason`),
);
const savedSource = computed(() => drafts.value[slot.value].storedDescription);
const isFilesOpen = defineModel<boolean>('filesOpen', { default: false });
const isEditorialOpen = defineModel<boolean>('editorialOpen', { default: false });
const WORKBENCH = 'admin.problems.workbench.statement';
</script>

<template>
  <Card as="div" padding="md" class="flex flex-col gap-4">
    <div ref="root" class="flex flex-col gap-4">
      <SegmentedControl
        v-model="slot"
        size="sm"
        class="self-start"
        :label="$t(`${KEY}.slotsLabel`)"
        :options="slotOptions"
      />
      <FormField
        v-if="slot !== 'original'"
        v-slot="{ id, describedBy, invalid }"
        class="max-w-xl"
        scale="admin"
        input-id="statement-name"
        :label="$t(`${KEY}.nameLabel`, { language: slotName })"
        :hint="
          current.exists
            ? $t(`${KEY}.nameHint`)
            : $t(`${KEY}.nameDefaultHint`, { language: slotName })
        "
        :error="errors.name"
      >
        <TextInput
          :id="id"
          v-model="current.name"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
        />
      </FormField>
      <MarkdownField
        v-model="current.description"
        :label="$t(`${KEY}.contentLabel`)"
        :preview-style="previewStyle"
        :hint="$t(`${KEY}.imageHint`)"
        :error="errors.description"
      >
        <template #toolbar>
          <div class="flex">
            <UploadButton
              :label="$t(`${KEY}.imageButton`)"
              :accept="IMAGE_ACCEPT"
              :max-bytes="IMAGE_MAX_BYTES"
              :is-pending="imageMutation.isPending.value"
              @picked="imageMutation.upload"
            />
          </div>
        </template>
      </MarkdownField>
    </div>
    <Notice v-if="isLocked" tone="warning" compact>{{
      needsPermissionText(FULL_MARKUP_PERMISSION)
    }}</Notice>
    <AdminStatus
      v-if="imageMutation.failure.value"
      kind="refused"
      :text="failureReasonOf(imageMutation.failure.value)"
    />
    <StatementTrust
      v-if="isTrustShown"
      :is-trusted="current.isMarkupTrusted"
      :is-full-markup="problem.isFullMarkup"
      :can-manage="canFullMarkup"
      :blocked-reason="trustBlockedReason"
      :source="savedSource"
      :busy="trustMutation.isPending.value"
      @set-trust="setTrust"
    />
    <AdminStatus
      v-if="trustMutation.failure.value"
      kind="refused"
      :text="failureReasonOf(trustMutation.failure.value)"
    />
    <p v-if="isFullMarkupHidden" class="m-0 text-small text-muted">
      {{ $t(`${KEY}.fullMarkupNote`) }}
    </p>
  </Card>
  <Disclosure v-model:open="isFilesOpen" :label="$t(`${WORKBENCH}.files`)">
    <ProblemFiles :problem="problem" :meta="meta" />
  </Disclosure>
  <Disclosure v-model:open="isEditorialOpen" :label="$t(`${WORKBENCH}.editorial`)">
    <Card as="div" padding="md">
      <EditorialFields v-model="editorialDraft" :content-error="contentError" />
    </Card>
  </Disclosure>
</template>
