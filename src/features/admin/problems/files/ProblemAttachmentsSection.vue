<script setup lang="ts">
import { computed } from 'vue';
import type { EditableProblem } from '@/api/types/problem-editing';
import { usePermissions } from '@/stores/use-permissions';
import { permissionLock } from '../general/field-lock';
import { UPLOAD_LIMITS } from '../../ui/upload-limits';
import ProblemUploadCard from './ProblemUploadCard.vue';

defineProps<{ problem: EditableProblem }>();
const { can } = usePermissions();
const pdfLock = computed(() => permissionLock(can, 'judge.upload_file_statement'));
const materialLock = computed(() => permissionLock(can, 'judge.upload_problem_material'));
</script>

<template>
  <section class="flex flex-col gap-4" :aria-labelledby="'attachments-heading'">
    <h2 id="attachments-heading" class="font-display text-xl leading-tight font-bold">
      {{ $t('admin.problems.files.attachments.title') }}
    </h2>
    <p class="text-sm text-muted">{{ $t('admin.problems.files.attachments.lead') }}</p>
    <div class="grid gap-5 lg:grid-cols-2">
      <ProblemUploadCard
        kind="pdf"
        test-id="attachment-pdf"
        :heading-level="3"
        :code="problem.code"
        :title="$t('admin.problems.files.pdf.title')"
        :lead="$t('admin.problems.files.pdf.lead')"
        :button-label="$t('admin.problems.files.attachments.pdfButton')"
        accept="application/pdf"
        :endpoint="`/problems/${problem.code}/statement`"
        :max-bytes="UPLOAD_LIMITS.statementPdf"
        :locked-by="pdfLock"
        :current-url="problem.pdfStatementUrl"
      />
      <ProblemUploadCard
        kind="material"
        test-id="attachment-material"
        :heading-level="3"
        :code="problem.code"
        :title="$t('admin.problems.files.material.title')"
        :lead="$t('admin.problems.files.material.lead')"
        :button-label="$t('admin.problems.files.attachments.materialButton')"
        accept=".zip,.pdf,.txt,.md"
        :endpoint="`/problems/${problem.code}/material`"
        :max-bytes="UPLOAD_LIMITS.material"
        :locked-by="materialLock"
        :current-url="problem.materialUrl"
      />
    </div>
  </section>
</template>
