<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import FormField from '@/components/ui/FormField.vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import SelectField from '@/components/ui/SelectField.vue';
import TextInput from '@/components/ui/TextInput.vue';
import type { FieldErrors } from '../ui/admin-errors';
import { CONTEST_REJUDGE_SCOPES } from './rejudge-filter';
import type { ContestRejudgeScope, RejudgeFilter } from './rejudge-filter';

/**
 * Where a rejudge run from a contest reaches: one of its problems (picked from the contest's own list), one contestant,
 * or the whole contest. The contest itself is not a field: the page that hosts the form pins it.
 */
export interface ContestScopeProblem {
  code: string;
  label: string;
  name: string;
}
const props = defineProps<{ problems: readonly ContestScopeProblem[]; errors: FieldErrors }>();
const filter = defineModel<RejudgeFilter>('filter', { required: true });
const scope = defineModel<ContestRejudgeScope>('scope', { required: true });
const { t } = useI18n();
const KEY = 'admin.rejudge.contestScope';
const scopeOptions = computed(() =>
  CONTEST_REJUDGE_SCOPES.map((value) => ({ value, label: t(`${KEY}.scopes.${value}`) })),
);
const problemOptions = computed(() =>
  props.problems.map((problem) => ({
    value: problem.code,
    label: `${problem.label} · ${problem.name} (${problem.code})`,
  })),
);
</script>

<template>
  <div class="flex flex-col gap-3" data-testid="rejudge-contest-scope">
    <SegmentedControl
      v-model="scope"
      size="sm"
      :label="$t(`${KEY}.label`)"
      :options="scopeOptions"
    />
    <FormField
      v-if="scope === 'problem'"
      class="sm:max-w-md"
      :label="$t(`${KEY}.problem`)"
      :error="errors.problem"
      input-id="rejudge-scope-problem"
    >
      <SelectField
        v-model="filter.problem"
        :placeholder="$t(`${KEY}.problemPlaceholder`)"
        :options="problemOptions"
      />
    </FormField>
    <FormField
      v-else-if="scope === 'user'"
      class="sm:max-w-md"
      :label="$t(`${KEY}.user`)"
      :hint="$t(`${KEY}.userHint`)"
      :error="errors.user"
      input-id="rejudge-scope-user"
    >
      <TextInput v-model="filter.user" autocomplete="off" />
    </FormField>
    <p v-else class="m-0 text-meta text-muted">{{ $t(`${KEY}.contestHint`) }}</p>
  </div>
</template>
