<script setup lang="ts">
import { computed, watch } from 'vue';
import AdminField from '../../ui/AdminField.vue';

/**
 * The problem code. With an organization `prefix` the prefix is a fixed part in front of the input and the code is
 * prefix + what is typed; the rule is said under the field. Switching owners keeps the typed part.
 */
const code = defineModel<string>({ required: true });
const props = defineProps<{ prefix: string; error?: string }>();

const suffixOf = (value: string, prefix: string) =>
  prefix && value.startsWith(prefix) ? value.slice(prefix.length) : value;
const suffix = computed({
  get: () => suffixOf(code.value, props.prefix),
  set: (value: string) => {
    code.value = props.prefix + value.trim();
  },
});
watch(
  () => props.prefix,
  (prefix, previous) => {
    code.value = prefix + suffixOf(code.value, previous ?? '');
  },
);
</script>

<template>
  <AdminField
    v-slot="{ id, describedBy }"
    input-id="problem-code"
    :label="$t('admin.problems.general.basics.code')"
    :hint="
      prefix
        ? $t('admin.creation.problem.prefixHint', { prefix, example: `${prefix}bai1` })
        : $t('admin.problems.general.basics.codeHint')
    "
    :error="error"
    required
  >
    <div
      class="flex min-w-0 overflow-hidden rounded-cell border border-line-strong bg-surface-solid focus-within:outline-2 focus-within:outline-focus"
      :class="error ? 'border-negative' : ''"
    >
      <span
        v-if="prefix"
        data-testid="problem-code-prefix"
        class="flex shrink-0 items-center border-r border-line-strong bg-surface-strong px-3 font-mono font-semibold text-muted"
        >{{ prefix }}</span
      >
      <input
        :id="id"
        v-model="suffix"
        class="min-h-[var(--qa-control,2.25rem)] w-full min-w-0 bg-transparent px-3 font-mono text-content outline-none"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        :placeholder="prefix ? 'bai1' : ''"
        :aria-describedby="describedBy"
        :aria-invalid="error ? 'true' : undefined"
      />
    </div>
  </AdminField>
</template>
