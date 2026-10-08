<script setup lang="ts">
import type { Language } from '@/api/types/problems';
import { SUBMISSION_RESULT_CODES } from '@/api/types/submissions';
import AdminField from '../ui/AdminField.vue';
import AdminSwitch from '../ui/AdminSwitch.vue';
import { ADMIN_BUTTON_CLASS, ADMIN_DANGER_CLASS, ADMIN_INPUT_CLASS } from '../ui/classes';
import type { FieldErrors } from '../ui/admin-errors';
import type { RejudgeFilter } from './rejudge-filter';

defineProps<{ languages: Language[]; errors: FieldErrors }>();
const filter = defineModel<RejudgeFilter>('filter', { required: true });
defineEmits<{ rejudge: []; reset: [] }>();
</script>

<template>
  <section
    class="glass flex flex-col gap-5 rounded-panel p-5 sm:p-6"
    aria-labelledby="rejudge-filter-title"
  >
    <header class="flex flex-wrap items-center gap-3">
      <h2 id="rejudge-filter-title" class="font-display text-xl font-semibold">
        {{ $t('admin.rejudge.filter.title') }}
      </h2>
      <span class="rounded-pill border border-line px-2.5 py-0.5 font-mono text-xs">
        judge.rejudge_submission
      </span>
    </header>

    <AdminField
      v-slot="{ id, describedBy }"
      :label="$t('admin.rejudge.filter.problem')"
      :hint="$t('admin.rejudge.filter.problemHint')"
      :error="errors.problem"
      input-id="rejudge-problem"
    >
      <input
        :id="id"
        v-model="filter.problem"
        type="text"
        :class="ADMIN_INPUT_CLASS"
        :aria-describedby="describedBy"
        :aria-invalid="errors.problem ? 'true' : undefined"
        autocomplete="off"
      />
    </AdminField>

    <div class="grid gap-4 sm:grid-cols-2">
      <AdminField
        v-slot="{ id, describedBy }"
        :label="$t('admin.rejudge.filter.idFrom')"
        :hint="$t('admin.rejudge.filter.idHint')"
        :error="errors.idFrom"
        input-id="rejudge-id-from"
      >
        <input
          :id="id"
          v-model="filter.idFrom"
          type="text"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="errors.idFrom ? 'true' : undefined"
          autocomplete="off"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy }"
        :label="$t('admin.rejudge.filter.idTo')"
        :error="errors.idTo"
        input-id="rejudge-id-to"
      >
        <input
          :id="id"
          v-model="filter.idTo"
          type="text"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="errors.idTo ? 'true' : undefined"
          autocomplete="off"
        />
      </AdminField>
    </div>

    <fieldset class="flex flex-col gap-2">
      <legend class="text-sm font-semibold">{{ $t('admin.rejudge.filter.languages') }}</legend>
      <p class="text-xs text-muted">{{ $t('admin.rejudge.filter.languagesHint') }}</p>
      <p v-if="errors.languages" class="text-sm text-negative">{{ errors.languages }}</p>
      <div class="flex flex-wrap gap-2">
        <label
          v-for="language in languages"
          :key="language.id"
          class="inline-flex min-h-11 items-center gap-2 rounded-pill border border-line px-3"
        >
          <input
            v-model="filter.languageIds"
            type="checkbox"
            name="rejudge-language"
            :value="language.id"
          />
          {{ language.name }}
        </label>
      </div>
    </fieldset>

    <fieldset class="flex flex-col gap-2">
      <legend class="text-sm font-semibold">{{ $t('admin.rejudge.filter.results') }}</legend>
      <p class="text-xs text-muted">{{ $t('admin.rejudge.filter.resultsHint') }}</p>
      <div class="flex flex-wrap gap-2">
        <label
          v-for="code in SUBMISSION_RESULT_CODES"
          :key="code"
          class="inline-flex min-h-11 items-center gap-2 rounded-pill border border-line px-3 font-mono"
        >
          <input v-model="filter.results" type="checkbox" name="rejudge-result" :value="code" />
          {{ code }}
        </label>
      </div>
    </fieldset>

    <AdminSwitch
      v-model="filter.force"
      :label="$t('admin.rejudge.filter.force')"
      :description="$t('admin.rejudge.filter.forceHint')"
    />
    <p class="text-sm text-muted">{{ $t('admin.rejudge.filter.lockedNote') }}</p>

    <div class="flex flex-wrap gap-3">
      <button type="button" :class="ADMIN_BUTTON_CLASS" @click="$emit('reset')">
        {{ $t('admin.rejudge.filter.reset') }}
      </button>
      <button type="button" :class="ADMIN_DANGER_CLASS" @click="$emit('rejudge')">
        {{ $t('admin.rejudge.filter.submit') }}
      </button>
    </div>
  </section>
</template>
