<script setup lang="ts">
import { computed } from 'vue';
import type { Language } from '@/api/types/problems';
import { SUBMISSION_RESULT_CODES } from '@/api/types/submissions';
import AdminField from '../ui/AdminField.vue';
import VerdictChips from '../ui/VerdictChips.vue';
import { ADMIN_BUTTON_CLASS, ADMIN_INPUT_CLASS, ADMIN_PRIMARY_CLASS } from '../ui/classes';
import { STAFF_STATUSES } from './admin-submission-filters';
import type { AdminSubmissionFilters } from './admin-submission-filters';

defineProps<{ languages: Language[] }>();
const filters = defineModel<AdminSubmissionFilters>('filters', { required: true });
defineEmits<{ apply: []; reset: [] }>();
/** One language at a time: the select reads and writes the first of the list. */
const language = computed({
  get: () => filters.value.languages[0] ?? '',
  set: (id: string) => (filters.value.languages = id ? [id] : []),
});
const TEXT_FIELDS = ['problem', 'user'] as const;
</script>

<template>
  <form
    class="glass flex flex-col gap-4 rounded-panel p-5"
    :aria-label="$t('admin.submissions.filters.title')"
    @submit.prevent="$emit('apply')"
  >
    <div class="grid gap-4 sm:grid-cols-3">
      <AdminField
        v-for="field in TEXT_FIELDS"
        :key="field"
        v-slot="{ id }"
        :label="$t(`admin.submissions.filters.${field}`)"
        :input-id="`admin-submissions-${field}`"
      >
        <input
          :id="id"
          v-model.trim="filters[field]"
          type="text"
          :class="ADMIN_INPUT_CLASS"
          autocomplete="off"
        />
      </AdminField>
      <AdminField
        v-slot="{ id }"
        :label="$t('admin.submissions.filters.language')"
        input-id="admin-submissions-language"
      >
        <select :id="id" v-model="language" :class="ADMIN_INPUT_CLASS">
          <option value="">{{ $t('admin.rejudge.summary.allLanguages') }}</option>
          <option v-for="item in languages" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
      </AdminField>
    </div>
    <fieldset class="flex flex-col gap-2">
      <legend class="text-sm font-semibold">{{ $t('admin.submissions.filters.status') }}</legend>
      <VerdictChips
        v-model="filters.statuses"
        :codes="STAFF_STATUSES"
        name="admin-submissions-statuses"
      />
    </fieldset>
    <fieldset class="flex flex-col gap-2">
      <legend class="text-sm font-semibold">{{ $t('admin.submissions.filters.result') }}</legend>
      <VerdictChips
        v-model="filters.results"
        :codes="SUBMISSION_RESULT_CODES"
        name="admin-submissions-results"
      />
    </fieldset>
    <div class="flex flex-wrap gap-3">
      <button type="submit" :class="ADMIN_PRIMARY_CLASS">
        {{ $t('admin.submissions.filters.apply') }}
      </button>
      <button type="button" :class="ADMIN_BUTTON_CLASS" @click="$emit('reset')">
        {{ $t('admin.submissions.filters.reset') }}
      </button>
    </div>
  </form>
</template>
