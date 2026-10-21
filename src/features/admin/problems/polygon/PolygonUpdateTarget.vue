<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { ApiError } from '@/api/client';
import Notice from '@/components/ui/Notice.vue';
import { fetchEditableProblem } from '@/api/problem-editing.api';
import { useViewerId } from '@/stores/use-viewer-id';
import { editableProblemKey } from '../problem-editing.queries';
import { PROBLEM_CODE_PATTERN } from '../problem-code';

/**
 * An update import's target, beside the code it names: which problem gets overwritten (its title), or that the viewer
 * has no such problem to edit (403, 404, or one it may only read). Asked once the typed code settles; any other failure
 * says nothing, since the server checks the target again on start.
 */
const props = defineProps<{ code: string }>();
const SETTLE_MS = 400;
const viewer = useViewerId();
const settled = ref(props.code);
let timer: ReturnType<typeof setTimeout> | undefined;
watch(
  () => props.code,
  (code) => {
    clearTimeout(timer);
    timer = setTimeout(() => (settled.value = code), SETTLE_MS);
  },
);
onBeforeUnmount(() => clearTimeout(timer));
const isWellFormed = computed(() => PROBLEM_CODE_PATTERN.test(settled.value));
const target = useQuery({
  queryKey: computed(() => editableProblemKey(settled.value, viewer.value)),
  queryFn: () => fetchEditableProblem(settled.value),
  enabled: isWellFormed,
  retry: false,
});
const title = computed(() => (target.data.value?.canEdit ? target.data.value.name : null));
const MISSING_STATUSES = new Set([403, 404]);
const isMissing = computed(() => {
  const error = target.error.value;
  if (error) return error instanceof ApiError && MISSING_STATUSES.has(error.status);
  return target.data.value !== undefined && !target.data.value.canEdit;
});
</script>

<template>
  <Notice
    v-if="isWellFormed && (title || isMissing)"
    compact
    :role="null"
    :tone="isMissing ? 'danger' : 'warning'"
    :title="
      isMissing
        ? $t('admin.polygonLink.configure.update.targetMissing', { code: settled })
        : $t('admin.polygonLink.configure.update.target', { code: settled })
    "
    data-testid="polygon-update-target"
  >
    <p v-if="title">{{ $t('admin.polygonLink.configure.update.targetBody', { title }) }}</p>
  </Notice>
</template>
