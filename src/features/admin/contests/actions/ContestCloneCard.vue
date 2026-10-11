<script setup lang="ts">
import { needsPermissionText } from '../../ui/permission-text';
import { computed, ref } from 'vue';
import { translate } from '@/i18n';
import { cloneContest } from '@/api/contest-editing.api';
import type { EditableContest } from '@/api/types/contest-editing';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { usePermissions } from '@/stores/use-permissions';
import AdminField from '../../ui/AdminField.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf, fieldErrorsOf } from '../../ui/admin-errors';
import { CARD, INPUT, buttonClass } from '../../ui/controls';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { CONTEST_INDEX_KEY, PUBLIC_CONTESTS_KEY } from '../contest-editing.queries';

const props = defineProps<{ contestKey: string }>();
const { can } = usePermissions();
const isOpen = ref(false);
const newKey = ref('');
const copyKey = ref<string | null>(null);
const localKeyError = ref('');
const isLocked = computed(() => !can('judge.clone_contest'));

/** An empty key is said here; any other key goes to the backend, which judges the taken or malformed ones. */
function confirmClone() {
  localKeyError.value = newKey.value.trim()
    ? ''
    : translate('admin.contests.general.errors.required');
  if (!localKeyError.value) void mutation.run(undefined);
}

const mutation = useAdminMutation({
  mutate: () => cloneContest(props.contestKey, newKey.value.trim()),
  invalidates: () => [PUBLIC_CONTESTS_KEY, CONTEST_INDEX_KEY],
  onDone: (copy: EditableContest) => {
    copyKey.value = copy.key;
    isOpen.value = false;
  },
});
</script>

<template>
  <section data-testid="action-clone" :class="[CARD, 'flex flex-col gap-3 p-5']">
    <h3 class="m-0 text-base font-semibold">
      {{ $t('admin.contests.actions.clone.title') }}
    </h3>
    <p class="text-sm text-muted">{{ $t('admin.contests.actions.clone.description') }}</p>
    <p v-if="isLocked" class="text-sm text-muted">
      {{ needsPermissionText('judge.clone_contest') }}
    </p>
    <button
      v-else
      type="button"
      :class="buttonClass('primary')"
      class="self-start"
      @click="isOpen = true"
    >
      {{ $t('admin.contests.actions.clone.button') }}
    </button>
    <AdminStatus
      v-if="copyKey"
      kind="done"
      :text="$t('admin.contests.actions.clone.done', { key: copyKey })"
    >
      <RouterLink
        :to="{ name: 'admin-contestGeneral', params: { key: copyKey } }"
        class="underline"
      >
        {{ $t('admin.contests.actions.clone.open') }}
      </RouterLink>
    </AdminStatus>

    <ConfirmDialog
      v-model:visible="isOpen"
      :title="$t('admin.contests.actions.clone.confirmTitle')"
      :confirm-label="$t('admin.contests.actions.clone.confirm')"
      :busy="mutation.isPending.value"
      @confirm="confirmClone"
    >
      <AdminField
        input-id="clone-key"
        :label="$t('admin.contests.actions.clone.keyLabel')"
        :error="localKeyError || fieldErrorsOf(mutation.failure.value).key"
      >
        <template #default="{ id, describedBy, invalid }">
          <input
            :id="id"
            v-model="newKey"
            :class="INPUT"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
            autocomplete="off"
          />
        </template>
      </AdminField>
      <template #error>
        <p
          v-if="mutation.failure.value && !fieldErrorsOf(mutation.failure.value).key"
          role="alert"
          class="text-sm text-negative"
        >
          {{ failureTextOf(mutation.failure.value) }}
        </p>
      </template>
    </ConfirmDialog>
  </section>
</template>
