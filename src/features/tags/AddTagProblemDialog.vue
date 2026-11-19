<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { createTagProblem } from '@/api/tags.api';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import FormField from '@/components/ui/FormField.vue';
import TextInput from '@/components/ui/TextInput.vue';
import AdminStatus from '@/features/admin/ui/AdminStatus.vue';
import { failureTextOf } from '@/features/admin/ui/admin-errors';
import { useAdminMutation } from '@/features/admin/ui/use-admin-mutation';
import { useTagProblemCache } from './tags.queries';

/** Adds a problem from another judge by its link and title, then opens its page to tag it. */
const visible = defineModel<boolean>('visible', { required: true });
const router = useRouter();
const store = useTagProblemCache();
const link = ref('');
const name = ref('');
watch(visible, (isVisible) => {
  if (!isVisible) return;
  link.value = '';
  name.value = '';
  create.reset();
});
const create = useAdminMutation({
  mutate: () => createTagProblem({ link: link.value.trim(), name: name.value.trim() }),
  onDone: (problem) => {
    store(problem);
    visible.value = false;
    void router.push({ name: 'tag-problem', params: { code: problem.code } });
  },
});
const canConfirm = computed(() => link.value.trim() !== '' && name.value.trim() !== '');
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t('tags.add.title')"
    :body="$t('tags.add.body')"
    :confirm-label="$t('tags.add.confirm')"
    :busy="create.isPending.value"
    :can-confirm="canConfirm"
    @confirm="create.run(undefined)"
  >
    <div class="flex flex-col gap-3">
      <FormField :label="$t('tags.add.link')" :hint="$t('tags.add.linkHint')">
        <TextInput v-model="link" type="url" inputmode="url" autocomplete="off" />
      </FormField>
      <FormField :label="$t('tags.add.name')">
        <TextInput v-model="name" autocomplete="off" />
      </FormField>
    </div>
    <template v-if="create.failure.value" #error>
      <AdminStatus kind="refused" :text="failureTextOf(create.failure.value)" />
    </template>
  </ConfirmDialog>
</template>
