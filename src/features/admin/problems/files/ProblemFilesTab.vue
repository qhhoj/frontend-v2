<script setup lang="ts">
import { computed } from 'vue';
import type { EditableProblem, ProblemEditingMeta } from '@/api/types/problem-editing';
import { usePermissions } from '@/stores/use-permissions';
import { permissionLock } from '../general/field-lock';
import { UPLOAD_LIMITS } from '../../ui/upload-limits';
import ProblemUploadCard from './ProblemUploadCard.vue';

defineProps<{ problem: EditableProblem; meta: ProblemEditingMeta }>();
const { can } = usePermissions();
const pdfLock = computed(() => permissionLock(can, 'judge.upload_file_statement'));
const materialLock = computed(() => permissionLock(can, 'judge.upload_problem_material'));
</script>

<template>
  <div class="grid gap-5 lg:grid-cols-3">
    <ProblemUploadCard
      kind="image"
      test-id="upload-image"
      :code="problem.code"
      :title="$t('admin.problems.files.image.title')"
      :lead="$t('admin.problems.files.image.lead')"
      :button-label="$t('admin.problems.files.image.button')"
      accept="image/*"
      endpoint="/problems/uploads/image"
    />
    <ProblemUploadCard
      kind="pdf"
      test-id="upload-pdf"
      :code="problem.code"
      :title="$t('admin.problems.files.pdf.title')"
      :lead="$t('admin.problems.files.pdf.lead')"
      :button-label="$t('admin.problems.files.pdf.button')"
      accept="application/pdf"
      :endpoint="`/problems/${problem.code}/statement`"
      :max-bytes="UPLOAD_LIMITS.statementPdf"
      :locked-by="pdfLock"
    />
    <ProblemUploadCard
      kind="material"
      test-id="upload-material"
      :code="problem.code"
      :title="$t('admin.problems.files.material.title')"
      :lead="$t('admin.problems.files.material.lead')"
      :button-label="$t('admin.problems.files.material.button')"
      accept=".zip,.pdf,.txt,.md"
      :endpoint="`/problems/${problem.code}/material`"
      :max-bytes="UPLOAD_LIMITS.material"
      :locked-by="materialLock"
    />
    <p class="text-xs text-muted lg:col-span-3">{{ $t('admin.problems.files.footer') }}</p>
  </div>
</template>
