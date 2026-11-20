<script setup lang="ts">
import { ref } from 'vue';
import { problemDataFileUrl } from '@/api/problem-data.api';
import type { ProblemData } from '@/api/types/problem-data';
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';
import InitYamlDialog from './InitYamlDialog.vue';

/** The stored archive in one line: its name (a download link), how many files it holds, whether init.yml was made, and the way to read it. */
defineProps<{ code: string; data: ProblemData }>();
const isInitShown = ref(false);
const KEY = 'admin.problems.data.archive';
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-meta" data-testid="archive-line">
    <template v-if="data.archive">
      <span class="text-muted">{{ $t(`${KEY}.current`) }}</span>
      <AppButton tone="link" class="font-mono" :href="problemDataFileUrl(code, data.archive)">
        {{ data.archive }}
      </AppButton>
      <span class="text-muted">{{
        $t(`${KEY}.fileCount`, { count: data.archiveFiles.length })
      }}</span>
    </template>
    <span v-else class="text-muted">{{ $t(`${KEY}.none`) }}</span>
    <Chip :tone="data.hasInit ? 'success' : 'warning'" dot>
      {{ data.hasInit ? $t(`${KEY}.initMade`) : $t(`${KEY}.initMissing`) }}
    </Chip>
    <AppButton v-if="data.hasInit" size="sm" tone="quiet" @click="isInitShown = true">
      {{ $t(`${KEY}.viewInit`) }}
    </AppButton>
    <InitYamlDialog v-model:visible="isInitShown" :code="code" />
  </div>
</template>
