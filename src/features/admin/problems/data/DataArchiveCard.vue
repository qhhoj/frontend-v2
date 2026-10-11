<script setup lang="ts">
import { computed, ref } from 'vue';
import { problemDataFileUrl } from '@/api/problem-data.api';
import type { ProblemData } from '@/api/types/problem-data';
import { Eye } from 'lucide-vue-next';
import { buttonClass } from '../../ui/controls';
import AdminChip from '../../ui/AdminChip.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import InitYamlDialog from './InitYamlDialog.vue';
import { ARCHIVE_PREVIEW_COUNT } from './test-cases';

/** The data card's first section: the archive, its init.yml and file names, and the upload; sections after it come in the slot. */
const props = defineProps<{ code: string; data: ProblemData }>();
const isInitShown = ref(false);
const previewFiles = computed(() => props.data.archiveFiles.slice(0, ARCHIVE_PREVIEW_COUNT));
const hiddenCount = computed(() => props.data.archiveFiles.length - previewFiles.value.length);
</script>

<template>
  <AdminFormSection
    :title="$t('admin.problems.data.archive.title')"
    :description="$t('admin.problems.data.archive.lead')"
    :columns="1"
  >
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <a
        v-if="data.archive"
        :href="problemDataFileUrl(code, data.archive)"
        class="inline-flex min-h-8 items-center font-mono font-semibold text-accent-text hover:underline"
        >{{ data.archive }}</a
      >
      <span v-else class="font-semibold">{{ $t('admin.problems.data.archive.none') }}</span>
      <AdminChip :tone="data.hasInit ? 'positive' : 'caution'">
        {{
          data.hasInit
            ? $t('admin.problems.data.archive.initMade')
            : $t('admin.problems.data.archive.initMissing')
        }}
      </AdminChip>
    </div>
    <ul v-if="previewFiles.length > 0" class="flex flex-wrap gap-1.5">
      <li v-for="file in previewFiles" :key="file">
        <AdminChip
          ><span class="font-mono">{{ file }}</span></AdminChip
        >
      </li>
      <li v-if="hiddenCount > 0" class="self-center text-xs text-muted">
        {{ $t('admin.problems.data.archive.more', { count: hiddenCount }) }}
      </li>
    </ul>
    <div class="flex flex-wrap gap-2">
      <slot name="upload" />
      <button
        v-if="data.hasInit"
        type="button"
        :class="buttonClass('secondary')"
        @click="isInitShown = true"
      >
        <Eye aria-hidden="true" class="size-4" :stroke-width="1.75" />
        {{ $t('admin.problems.data.archive.viewInit') }}
      </button>
    </div>
    <p class="text-xs text-muted">{{ $t('admin.problems.data.archive.note') }}</p>
    <slot name="summary" />
    <InitYamlDialog v-model:visible="isInitShown" :code="code" />
  </AdminFormSection>
</template>
