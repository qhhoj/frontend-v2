<script setup lang="ts">
import { computed, ref } from 'vue';
import { problemDataFileUrl } from '@/api/problem-data.api';
import type { ProblemData } from '@/api/types/problem-data';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import { ADMIN_BUTTON_CLASS } from '../../ui/classes';
import InitYamlDialog from './InitYamlDialog.vue';
import { ARCHIVE_PREVIEW_COUNT } from './test-cases';

const props = defineProps<{ code: string; data: ProblemData }>();
const isInitShown = ref(false);
const previewFiles = computed(() => props.data.archiveFiles.slice(0, ARCHIVE_PREVIEW_COUNT));
const hiddenCount = computed(() => props.data.archiveFiles.length - previewFiles.value.length);
</script>

<template>
  <SettingsCard
    :title="$t('admin.problems.data.archive.title')"
    :lead="$t('admin.problems.data.archive.lead')"
  >
    <div class="flex flex-col gap-1 text-sm">
      <a
        v-if="data.archive"
        :href="problemDataFileUrl(code, data.archive)"
        class="inline-flex min-h-11 items-center font-mono font-semibold text-accent-text underline"
        >{{ data.archive }}</a
      >
      <p v-else class="font-mono font-semibold">{{ $t('admin.problems.data.archive.none') }}</p>
      <p class="text-muted">
        {{
          data.hasInit
            ? $t('admin.problems.data.archive.initMade')
            : $t('admin.problems.data.archive.initMissing')
        }}
      </p>
    </div>
    <ul class="flex flex-wrap gap-x-4 gap-y-1">
      <li v-for="file in previewFiles" :key="file">
        <span class="font-mono text-sm">{{ file }}</span>
      </li>
    </ul>
    <p v-if="hiddenCount > 0" class="text-sm text-muted">
      {{ $t('admin.problems.data.archive.more', { count: hiddenCount }) }}
    </p>
    <div class="flex flex-wrap gap-2">
      <button
        v-if="data.hasInit"
        type="button"
        :class="ADMIN_BUTTON_CLASS"
        @click="isInitShown = true"
      >
        {{ $t('admin.problems.data.archive.viewInit') }}
      </button>
      <slot name="upload" />
    </div>
    <p class="text-xs text-muted">{{ $t('admin.problems.data.archive.note') }}</p>
    <InitYamlDialog v-model:visible="isInitShown" :code="code" />
  </SettingsCard>
</template>
