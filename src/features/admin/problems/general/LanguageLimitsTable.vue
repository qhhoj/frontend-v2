<script setup lang="ts">
import { computed, ref } from 'vue';
import { Plus, X } from 'lucide-vue-next';
import type { LanguageOption } from '@/api/types/problem-editing';
import LanguageLabel from '@/components/language/LanguageLabel.vue';
import { languageById } from '@/components/language/language-by-id';
import type { FieldErrors } from '../../ui/admin-errors';
import { INPUT, buttonClass, iconButtonClass } from '../../ui/controls';
import type { LanguageLimitForm } from './problem-form';

/**
 * Per-language limits as rows "Python 3 · 4.5 s · 256 MB · ×". From `sm` the columns share one header; on a phone each row
 * stacks with its own labels.
 */
const limits = defineModel<LanguageLimitForm[]>({ required: true });
const props = defineProps<{
  languages: LanguageOption[];
  errors: FieldErrors;
  defaultTimeLimit: number;
  defaultMemoryLimit: number;
}>();
const pickedLanguageId = ref('');

const languageOf = (languageId: string) => languageById(props.languages, languageId);
const nameOf = (languageId: string) => languageOf(languageId)?.name ?? languageId;
const unlistedLanguages = computed(() =>
  props.languages.filter(
    (language) => !limits.value.some((limit) => limit.languageId === language.id),
  ),
);
const timeErrorOf = (index: number) => props.errors[`languageLimits.${index}.timeLimit`];
const memoryErrorOf = (index: number) => props.errors[`languageLimits.${index}.memoryLimit`];

function addLimit() {
  if (!pickedLanguageId.value) return;
  limits.value.push({
    languageId: pickedLanguageId.value,
    timeLimit: props.defaultTimeLimit,
    memoryLimit: props.defaultMemoryLimit,
  });
  pickedLanguageId.value = '';
}

function removeLimit(index: number) {
  limits.value.splice(index, 1);
}

const ROW =
  'grid grid-cols-2 items-start gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,1fr)_9rem_9rem_auto]';
</script>

<template>
  <div class="flex flex-col gap-2">
    <h3 class="text-sm font-semibold">{{ $t('admin.problems.general.limits.languageTitle') }}</h3>
    <div
      v-if="limits.length > 0"
      aria-hidden="true"
      :class="[ROW, 'hidden text-xs font-semibold text-muted sm:grid']"
    >
      <span>{{ $t('admin.problems.general.limits.languageColumn') }}</span>
      <span>{{ $t('admin.problems.general.limits.timeColumn') }}</span>
      <span>{{ $t('admin.problems.general.limits.memoryColumn') }}</span>
      <span class="w-9" />
    </div>
    <ul v-if="limits.length > 0" class="flex flex-col divide-y divide-line">
      <li v-for="(limit, index) in limits" :key="limit.languageId" :class="[ROW, 'py-2']">
        <span
          class="col-span-1 flex min-h-(--qa-control) items-center text-sm font-semibold sm:col-span-1"
        >
          <LanguageLabel
            :language="{
              key: languageOf(limit.languageId)?.key ?? null,
              name: nameOf(limit.languageId),
            }"
          />
        </span>
        <span class="flex justify-end sm:order-last">
          <button
            type="button"
            :class="iconButtonClass('ghost')"
            :aria-label="
              $t('admin.problems.general.limits.removeLimit', {
                language: nameOf(limit.languageId),
              })
            "
            :title="
              $t('admin.problems.general.limits.removeLimit', {
                language: nameOf(limit.languageId),
              })
            "
            @click="removeLimit(index)"
          >
            <X aria-hidden="true" class="size-4" :stroke-width="1.75" />
          </button>
        </span>
        <label class="flex flex-col gap-1 text-xs font-semibold text-muted">
          <span class="sm:sr-only">{{ $t('admin.problems.general.limits.timeColumn') }}</span>
          <input
            :id="`language-limit-time-${index}`"
            v-model.number="limit.timeLimit"
            type="number"
            inputmode="decimal"
            step="0.01"
            :class="[INPUT, 'font-mono font-normal text-content tabular-nums']"
            :aria-label="
              $t('admin.problems.general.limits.timeFor', { language: nameOf(limit.languageId) })
            "
            :aria-invalid="timeErrorOf(index) ? 'true' : undefined"
            :aria-describedby="
              timeErrorOf(index) ? `language-limit-time-${index}-error` : undefined
            "
          />
          <span
            v-if="timeErrorOf(index)"
            :id="`language-limit-time-${index}-error`"
            class="text-sm font-normal text-negative"
          >
            {{ timeErrorOf(index) }}
          </span>
        </label>
        <label class="flex flex-col gap-1 text-xs font-semibold text-muted">
          <span class="sm:sr-only">{{ $t('admin.problems.general.limits.memoryColumn') }}</span>
          <input
            v-model.number="limit.memoryLimit"
            type="number"
            inputmode="numeric"
            step="1"
            :class="[INPUT, 'font-mono font-normal text-content tabular-nums']"
            :aria-label="
              $t('admin.problems.general.limits.memoryFor', { language: nameOf(limit.languageId) })
            "
            :aria-invalid="memoryErrorOf(index) ? 'true' : undefined"
            :aria-describedby="
              memoryErrorOf(index) ? `language-limit-memory-${index}-error` : undefined
            "
          />
          <span
            v-if="memoryErrorOf(index)"
            :id="`language-limit-memory-${index}-error`"
            class="text-sm font-normal text-negative"
          >
            {{ memoryErrorOf(index) }}
          </span>
        </label>
      </li>
    </ul>
    <p v-else class="text-sm text-muted">{{ $t('admin.problems.general.limits.noLimits') }}</p>
    <div v-if="unlistedLanguages.length > 0" class="flex flex-wrap items-center gap-2">
      <select
        v-model="pickedLanguageId"
        :aria-label="$t('admin.problems.general.limits.pickLanguage')"
        :class="[INPUT, 'w-full sm:w-auto sm:max-w-80 sm:min-w-0 sm:flex-1']"
      >
        <option value="">{{ $t('admin.problems.general.limits.pickLanguage') }}</option>
        <option v-for="language in unlistedLanguages" :key="language.id" :value="language.id">
          {{ language.name }}
        </option>
      </select>
      <button type="button" :class="buttonClass('secondary')" @click="addLimit">
        <Plus aria-hidden="true" class="size-4" :stroke-width="1.75" />
        {{ $t('admin.problems.general.limits.addLimit') }}
      </button>
    </div>
  </div>
</template>
