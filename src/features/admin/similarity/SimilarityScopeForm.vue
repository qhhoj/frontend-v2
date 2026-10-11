<script setup lang="ts">
import { ref, useId, watch } from 'vue';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import type { SimilarityScope, SimilarityScopeKind } from '@/api/types/similarity';
import AdminChip from '../ui/AdminChip.vue';
import { INPUT, buttonClass } from '../ui/controls';
import { needsPermissionText } from '../ui/permission-text';
import { scopeKindOf, scopeValueOf } from './similarity-runs';

const props = defineProps<{ scope: SimilarityScope | null; isPending: boolean }>();
const emit = defineEmits<{ view: [scope: SimilarityScope]; start: [] }>();

const valueInputId = useId();
const kind = ref<SimilarityScopeKind>(props.scope ? scopeKindOf(props.scope) : 'problem');
const typed = ref(props.scope ? scopeValueOf(props.scope) : '');
/** The URL changed under the form (a link, the back button): the fields follow it. */
watch(
  () => props.scope,
  (scope) => {
    if (!scope) return;
    kind.value = scopeKindOf(scope);
    typed.value = scopeValueOf(scope);
  },
);

const submitView = () => {
  const value = typed.value.trim();
  if (!value) return;
  emit('view', kind.value === 'problem' ? { problem: value } : { contest: value });
};
</script>

<template>
  <SettingsCard
    :title="$t('admin.similarity.scope.heading')"
    :lead="$t('admin.similarity.scope.lead')"
  >
    <template #header-end>
      <AdminChip>{{ needsPermissionText('judge.moss_contest') }}</AdminChip>
    </template>
    <form class="flex flex-col gap-4" @submit.prevent="submitView">
      <fieldset class="flex flex-wrap gap-4">
        <legend class="mb-2 text-sm font-semibold">
          {{ $t('admin.similarity.scope.kindLegend') }}
        </legend>
        <label class="inline-flex min-h-11 items-center gap-2">
          <input v-model="kind" type="radio" value="problem" />
          {{ $t('admin.similarity.scope.problem') }}
        </label>
        <label class="inline-flex min-h-11 items-center gap-2">
          <input v-model="kind" type="radio" value="contest" />
          {{ $t('admin.similarity.scope.contest') }}
        </label>
      </fieldset>
      <div class="flex flex-wrap items-end gap-2">
        <div class="flex min-w-60 flex-1 flex-col gap-1.5">
          <label :for="valueInputId" class="text-sm font-semibold">
            {{
              kind === 'problem'
                ? $t('admin.similarity.scope.problemCode')
                : $t('admin.similarity.scope.contestKey')
            }}
          </label>
          <input :id="valueInputId" v-model="typed" :class="INPUT" autocomplete="off" />
        </div>
        <button type="submit" :class="buttonClass()">
          {{ $t('admin.similarity.scope.view') }}
        </button>
      </div>
    </form>
    <div v-if="scope" class="flex flex-wrap items-center gap-3">
      <button
        type="button"
        :class="buttonClass('primary')"
        :aria-disabled="isPending || undefined"
        @click="emit('start')"
      >
        {{ $t('admin.similarity.scope.start') }}
      </button>
      <p class="text-sm text-muted">{{ $t('admin.similarity.scope.startHint') }}</p>
    </div>
    <p v-else class="text-sm text-muted">{{ $t('admin.similarity.scope.noScope') }}</p>
  </SettingsCard>
</template>
