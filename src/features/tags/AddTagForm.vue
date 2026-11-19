<script setup lang="ts">
import { computed, ref } from 'vue';
import { assignTags } from '@/api/tags.api';
import type { TagProblem } from '@/api/tags.api';
import AppButton from '@/components/ui/AppButton.vue';
import FormField from '@/components/ui/FormField.vue';
import SelectField from '@/components/ui/SelectField.vue';
import AdminStatus from '@/features/admin/ui/AdminStatus.vue';
import { failureTextOf } from '@/features/admin/ui/admin-errors';
import { useAdminMutation } from '@/features/admin/ui/use-admin-mutation';
import { useTagCatalogQuery, useTagProblemCache } from './tags.queries';

/** Adds one tag from the catalog to the problem; the tags it already has are left out of the list. */
const props = defineProps<{ problem: TagProblem }>();
const catalog = useTagCatalogQuery();
const store = useTagProblemCache();
const picked = ref('');
const present = computed(() => new Set(props.problem.tags.map((tag) => tag.code)));
const groups = computed(() =>
  (catalog.data.value ?? [])
    .map((group) => ({
      ...group,
      tags: group.tags.filter((tag) => !present.value.has(tag.code)),
    }))
    .filter((group) => group.tags.length > 0),
);
const assign = useAdminMutation({
  mutate: () => assignTags(props.problem.code, [picked.value]),
  onDone: (problem) => {
    store(problem);
    picked.value = '';
  },
});
</script>

<template>
  <form class="flex flex-wrap items-end gap-3" @submit.prevent="picked && assign.run(undefined)">
    <FormField :label="$t('tags.assign.label')">
      <SelectField v-model="picked" :placeholder="$t('tags.assign.placeholder')">
        <optgroup v-for="group in groups" :key="group.id" :label="group.name">
          <option v-for="tag in group.tags" :key="tag.id" :value="tag.code">{{ tag.name }}</option>
        </optgroup>
      </SelectField>
    </FormField>
    <AppButton
      type="submit"
      :loading="assign.isPending.value"
      :disabled="!picked"
      :disabled-reason="picked ? undefined : $t('tags.assign.pickFirst')"
    >
      {{ $t('tags.assign.submit') }}
    </AppButton>
    <AdminStatus
      v-if="assign.failure.value"
      class="basis-full"
      kind="refused"
      :text="failureTextOf(assign.failure.value)"
    />
  </form>
</template>
