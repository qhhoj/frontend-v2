<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Language } from '@/api/types/problems';
import { languageById } from '@/components/language/language-by-id';
import { SUBMISSION_RESULT_CODES } from '@/api/types/submissions';
import AdminField from '../ui/AdminField.vue';
import VerdictChips from '../ui/VerdictChips.vue';
import { INPUT } from '../ui/controls';
import AdminFilterBar from '../ui/table/AdminFilterBar.vue';
import type { ActiveFilter } from '../ui/table/AdminFilterBar.vue';
import { STAFF_STATUSES } from './admin-submission-filters';
import type { AdminSubmissionFilters } from './admin-submission-filters';

/**
 * The list's filter row: the search box takes a problem code; "Bộ lọc" holds the user, the language and the two code groups.
 * Every change is emitted at once (the page writes it to the URL); the user box applies on Enter or when it loses focus.
 */
const props = defineProps<{
  filters: AdminSubmissionFilters;
  languages: Language[];
  resultText?: string;
}>();
const emit = defineEmits<{ change: [next: AdminSubmissionFilters] }>();
const { t } = useI18n();

const change = (patch: Partial<AdminSubmissionFilters>) =>
  emit('change', { ...props.filters, ...patch, page: 1 });
const problem = computed({
  get: () => props.filters.problem,
  set: (value: string) => change({ problem: value.trim() }),
});
const user = ref(props.filters.user);
watch(
  () => props.filters.user,
  (value) => (user.value = value),
);
const applyUser = () => {
  if (user.value.trim() !== props.filters.user) change({ user: user.value.trim() });
};
const language = computed({
  get: () => props.filters.languages[0] ?? '',
  set: (id: string) => change({ languages: id ? [id] : [] }),
});
const statuses = computed({
  get: () => props.filters.statuses,
  set: (codes) => change({ statuses: codes }),
});
const results = computed({
  get: () => props.filters.results,
  set: (codes) => change({ results: codes }),
});

const languageName = (id: string) => languageById(props.languages, id)?.name ?? id;
const chips = computed<ActiveFilter[]>(() => [
  ...(props.filters.user
    ? [{ key: 'user', label: `${t('admin.submissions.filters.user')}: ${props.filters.user}` }]
    : []),
  ...props.filters.languages.map((id) => ({ key: 'language', label: languageName(id) })),
  ...props.filters.statuses.map((code) => ({ key: `status:${code}`, label: code })),
  ...props.filters.results.map((code) => ({ key: `result:${code}`, label: code })),
]);

function remove(key: string) {
  const [kind, code] = key.split(':');
  if (kind === 'user') change({ user: '' });
  else if (kind === 'language') change({ languages: [] });
  else if (kind === 'status')
    change({ statuses: props.filters.statuses.filter((item) => item !== code) });
  else change({ results: props.filters.results.filter((item) => item !== code) });
}
const clearAll = () => change({ problem: '', user: '', languages: [], statuses: [], results: [] });
</script>

<template>
  <AdminFilterBar
    v-model:search="problem"
    :search-label="$t('admin.submissions.filters.problem')"
    :result-text="resultText"
    :chips="chips"
    :filter-count="chips.length"
    @remove="remove"
    @clear-all="clearAll"
  >
    <template #filters>
      <AdminField
        v-slot="{ id }"
        :label="$t('admin.submissions.filters.user')"
        input-id="admin-submissions-user"
      >
        <input
          :id="id"
          v-model="user"
          type="text"
          :class="INPUT"
          autocomplete="off"
          @change="applyUser"
          @keydown.enter.prevent="applyUser"
        />
      </AdminField>
      <AdminField
        v-slot="{ id }"
        :label="$t('admin.submissions.filters.language')"
        input-id="admin-submissions-language"
      >
        <select :id="id" v-model="language" :class="INPUT">
          <option value="">{{ $t('admin.rejudge.summary.allLanguages') }}</option>
          <option v-for="item in languages" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
      </AdminField>
      <fieldset class="flex flex-col gap-2 sm:col-span-2">
        <legend class="mb-2 text-sm font-semibold">
          {{ $t('admin.submissions.filters.status') }}
        </legend>
        <VerdictChips
          v-model="statuses"
          :codes="STAFF_STATUSES"
          name="admin-submissions-statuses"
        />
      </fieldset>
      <fieldset class="flex flex-col gap-2 sm:col-span-2 lg:col-span-4">
        <legend class="mb-2 text-sm font-semibold">
          {{ $t('admin.submissions.filters.result') }}
        </legend>
        <VerdictChips
          v-model="results"
          :codes="SUBMISSION_RESULT_CODES"
          name="admin-submissions-results"
        />
      </fieldset>
    </template>
  </AdminFilterBar>
</template>
