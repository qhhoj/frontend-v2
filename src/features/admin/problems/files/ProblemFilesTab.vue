<script setup lang="ts">
import { computed } from 'vue';
import type { EditableProblem, ProblemEditingMeta } from '@/api/types/problem-editing';
import { UPLOAD_LIMITS } from '../../ui/upload-limits';
import { acceptOfExtensions, IMAGE_ACCEPT, IMAGE_MAX_BYTES } from '../limits';
import ProblemUploadCard from './ProblemUploadCard.vue';

/**
 * Three tiles: images for the statement (address only), the PDF statement, the material for contestants.
 * The server decides who may upload the PDF and material (the global permission, or administering the problem's
 * organizations); a tile it refuses names the global permission.
 */
const props = defineProps<{ problem: EditableProblem; meta: ProblemEditingMeta }>();
const pdfLock = computed(() =>
  props.problem.editor?.canUploadPdfStatement ? undefined : 'judge.upload_file_statement',
);
const materialLock = computed(() =>
  props.problem.editor?.canUploadMaterial ? undefined : 'judge.upload_problem_material',
);
const materialAccept = computed(() => acceptOfExtensions(props.meta.materialExtensions));
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    <ProblemUploadCard
      kind="image"
      test-id="upload-image"
      :code="problem.code"
      :title="$t('admin.problems.files.image.title')"
      :lead="$t('admin.problems.files.image.lead')"
      :accept="IMAGE_ACCEPT"
      :max-bytes="IMAGE_MAX_BYTES"
    />
    <ProblemUploadCard
      kind="pdf"
      test-id="upload-pdf"
      :code="problem.code"
      :title="$t('admin.problems.files.pdf.title')"
      :lead="$t('admin.problems.files.pdf.lead')"
      accept="application/pdf"
      :max-bytes="UPLOAD_LIMITS.statementPdf"
      :locked-by="pdfLock"
      :current-url="problem.pdfStatementUrl"
    />
    <ProblemUploadCard
      kind="material"
      test-id="upload-material"
      :code="problem.code"
      :title="$t('admin.problems.files.material.title')"
      :lead="$t('admin.problems.files.material.lead')"
      :accept="materialAccept"
      :max-bytes="UPLOAD_LIMITS.material"
      :locked-by="materialLock"
      :current-url="problem.materialUrl"
    />
  </div>
</template>
