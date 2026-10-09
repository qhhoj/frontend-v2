<script setup lang="ts">
import { computed, ref } from 'vue';
import type { LanguageOption } from '@/api/types/problem-editing';
import type { FieldErrors } from '../../ui/admin-errors';
import { ADMIN_BUTTON_CLASS, ADMIN_INPUT_CLASS } from '../../ui/classes';
import type { LanguageLimitForm } from './problem-form';

const limits = defineModel<LanguageLimitForm[]>({ required: true });
const props = defineProps<{
  languages: LanguageOption[];
  errors: FieldErrors;
  defaultTimeLimit: number;
  defaultMemoryLimit: number;
}>();
const pickedLanguageId = ref('');

const nameOf = (languageId: string) =>
  props.languages.find((language) => language.id === languageId)?.name ?? languageId;
const unlistedLanguages = computed(() =>
  props.languages.filter(
    (language) => !limits.value.some((limit) => limit.languageId === language.id),
  ),
);

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
</script>

<template>
  <div class="flex flex-col gap-3">
    <h3 class="text-sm font-semibold">{{ $t('admin.problems.general.limits.languageTitle') }}</h3>
    <table class="block w-full sm:table">
      <caption class="sr-only">
        {{
          $t('admin.problems.general.limits.languageTitle')
        }}
      </caption>
      <thead class="hidden sm:table-header-group">
        <tr class="text-left text-sm text-muted">
          <th scope="col" class="p-2">{{ $t('admin.problems.general.limits.languageColumn') }}</th>
          <th scope="col" class="p-2">{{ $t('admin.problems.general.limits.timeColumn') }}</th>
          <th scope="col" class="p-2">{{ $t('admin.problems.general.limits.memoryColumn') }}</th>
          <th scope="col" class="p-2">{{ $t('admin.problems.general.limits.removeColumn') }}</th>
        </tr>
      </thead>
      <tbody class="block sm:table-row-group">
        <template v-for="(limit, index) in limits" :key="limit.languageId">
          <tr class="block border-b border-line py-2 sm:table-row">
            <td class="block p-2 font-semibold sm:table-cell">{{ nameOf(limit.languageId) }}</td>
            <td class="block p-2 sm:table-cell">
              <input
                :id="`language-limit-time-${index}`"
                v-model.number="limit.timeLimit"
                type="number"
                step="0.01"
                :class="ADMIN_INPUT_CLASS"
                :aria-label="
                  $t('admin.problems.general.limits.timeFor', {
                    language: nameOf(limit.languageId),
                  })
                "
                :aria-describedby="
                  errors[`languageLimits.${index}.timeLimit`]
                    ? `language-limit-time-${index}-error`
                    : undefined
                "
              />
              <p
                v-if="errors[`languageLimits.${index}.timeLimit`]"
                :id="`language-limit-time-${index}-error`"
                class="text-sm text-negative"
              >
                {{ errors[`languageLimits.${index}.timeLimit`] }}
              </p>
            </td>
            <td class="block p-2 sm:table-cell">
              <input
                v-model.number="limit.memoryLimit"
                type="number"
                step="1"
                :class="ADMIN_INPUT_CLASS"
                :aria-label="
                  $t('admin.problems.general.limits.memoryFor', {
                    language: nameOf(limit.languageId),
                  })
                "
              />
            </td>
            <td class="block p-2 sm:table-cell">
              <button type="button" :class="ADMIN_BUTTON_CLASS" @click="removeLimit(index)">
                {{
                  $t('admin.problems.general.limits.removeLimit', {
                    language: nameOf(limit.languageId),
                  })
                }}
              </button>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
    <div v-if="unlistedLanguages.length > 0" class="flex flex-wrap items-end gap-2">
      <label class="flex min-w-60 flex-1 flex-col gap-1.5 text-sm font-semibold">
        {{ $t('admin.problems.general.limits.pickLanguage') }}
        <select v-model="pickedLanguageId" :class="ADMIN_INPUT_CLASS">
          <option value="">{{ $t('admin.problems.general.limits.pickLanguage') }}</option>
          <option v-for="language in unlistedLanguages" :key="language.id" :value="language.id">
            {{ language.name }}
          </option>
        </select>
      </label>
      <button type="button" :class="ADMIN_BUTTON_CLASS" @click="addLimit">
        {{ $t('admin.problems.general.limits.addLimit') }}
      </button>
    </div>
  </div>
</template>
