<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { deleteConfig, putConfig } from '@/api/site-admin.api';
import { translate } from '@/i18n';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import AdminChip from '../ui/AdminChip.vue';
import { BUTTON, INPUT } from '../ui/controls';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import AdminLeaveGuard from '../ui/form/AdminLeaveGuard.vue';
import AdminSaveBar from '../ui/form/AdminSaveBar.vue';
import HtmlPreview from './HtmlPreview.vue';
import { CONFIG_KEY_PATTERN, checkConfigValue, configKindOf } from './config-kinds';
import ConfigHistory from './ConfigHistory.vue';
import { knownConfigKey } from './config-registry';
import { refreshAfterConfigWrite, writeConfig } from './site.queries';

const props = defineProps<{
  configKey: string;
  isNew: boolean;
  initialValue: string;
  takenKeys: string[];
}>();
const emit = defineEmits<{ deleted: [key: string]; close: [] }>();

const queryClient = useQueryClient();
const keyName = ref(props.configKey);
const value = ref(props.initialValue);
const isCreating = ref(props.isNew);
const localErrors = ref<Record<string, string>>({});
const isDeleteOpen = ref(false);
/** The value as last saved: the save bar counts the edit against it and "Huỷ thay đổi" puts it back. */
const savedValue = ref(props.initialValue);
const savedAt = ref<Date | null>(null);
const dirtyCount = computed(() => (isCreating.value || value.value === savedValue.value ? 0 : 1));
const kind = computed(() => configKindOf(keyName.value, value.value));

/** The key's own check, then the value's; a new key must be free. */
function keyProblem(name: string): string | null {
  if (!CONFIG_KEY_PATTERN.test(name)) return translate('admin.site.config.errors.keyPattern');
  return props.takenKeys.includes(name) ? translate('admin.site.config.errors.keyTaken') : null;
}

function checkForm(): Record<string, string> {
  const errors: Record<string, string> = {};
  const keyError = isCreating.value ? keyProblem(keyName.value) : null;
  const valueError = checkConfigValue(kind.value, value.value);
  if (keyError) errors.key = keyError;
  if (valueError) errors.value = valueError;
  return errors;
}

const save = useAdminMutation({
  mutate: ({ key, text }: { key: string; text: string }) => putConfig(key, text),
  successText: (result) => translate('admin.site.config.saved', { key: result.key }),
  onDone: (result) => {
    writeConfig(queryClient, result.key, result.value);
    refreshAfterConfigWrite(queryClient);
    isCreating.value = false;
    savedValue.value = result.value;
    savedAt.value = new Date();
  },
});

function submit() {
  localErrors.value = checkForm();
  if (Object.keys(localErrors.value).length > 0) return;
  void save.run({ key: keyName.value, text: value.value });
}

const remove = useAdminMutation({
  mutate: (key: string) => deleteConfig(key),
  successText: (_result, key) => translate('admin.site.config.deleted', { key }),
  onDone: (_result, key) => {
    writeConfig(queryClient, key, null);
    refreshAfterConfigWrite(queryClient);
    emit('deleted', key);
  },
});

async function confirmDelete() {
  await remove.run(keyName.value);
  if (remove.isDone.value) isDeleteOpen.value = false;
}

/** The text under a field: this form's own check first, then the backend's answer for it. */
const errorOf = (field: string): string | undefined =>
  localErrors.value[field] ?? save.fieldErrors.value[field];
</script>

<template>
  <div class="flex flex-col gap-4">
    <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
      <AdminField
        v-if="isCreating"
        v-slot="{ id, describedBy }"
        :label="$t('admin.site.config.keyLabel')"
        :hint="$t('admin.site.config.keyHint')"
        :error="errorOf('key')"
        input-id="config-key"
      >
        <input
          :id="id"
          v-model="keyName"
          :class="[INPUT, 'font-mono']"
          :aria-describedby="describedBy"
          :aria-invalid="errorOf('key') ? 'true' : undefined"
          autocomplete="off"
        />
      </AdminField>
      <p v-if="knownConfigKey(keyName)" class="text-sm text-muted">
        {{ $t(`admin.site.config.known.${keyName}`) }}
      </p>

      <div class="flex flex-wrap items-center gap-2">
        <AdminChip :tone="kind === 'text' ? 'neutral' : 'info'">
          {{ $t(`admin.site.config.kinds.${kind}`) }}
        </AdminChip>
      </div>

      <AdminField
        v-slot="{ id, describedBy }"
        :label="$t('admin.site.config.valueLabel')"
        :hint="$t('admin.site.config.valueHint')"
        :error="errorOf('value')"
        input-id="config-value"
      >
        <textarea
          :id="id"
          v-model="value"
          rows="8"
          :class="[INPUT, 'min-h-[8rem] py-2 font-mono text-sm']"
          :aria-describedby="describedBy"
          :aria-invalid="errorOf('value') ? 'true' : undefined"
        />
      </AdminField>
      <p class="text-right text-xs text-muted">
        {{ $t('admin.site.config.counter', { length: value.length }) }}
      </p>

      <HtmlPreview v-if="kind === 'html'" :html="value" />
      <p v-else-if="kind === 'url'" class="text-sm text-muted">
        {{ $t('admin.site.config.urlNote') }}
      </p>
      <p v-else-if="kind === 'tracking'" class="text-sm text-muted">
        {{ $t('admin.site.config.trackingNote') }}
      </p>

      <AdminStatus
        v-if="save.failure.value"
        kind="refused"
        :text="failureTextOf(save.failure.value)"
      />

      <AdminSaveBar
        variant="footer"
        :dirty-count="dirtyCount"
        :pending="save.isPending.value"
        :saved-at="savedAt"
        :allow-clean="isCreating"
        :save-label="$t('admin.site.config.save')"
        @discard="value = savedValue"
      >
        <template #actions>
          <button
            v-if="!isCreating"
            type="button"
            :class="BUTTON.danger"
            @click="isDeleteOpen = true"
          >
            {{ $t('admin.site.config.delete') }}
          </button>
          <button type="button" :class="BUTTON.ghost" @click="emit('close')">
            {{ $t('admin.site.config.close') }}
          </button>
        </template>
      </AdminSaveBar>
    </form>
    <AdminLeaveGuard :dirty-count="dirtyCount" />

    <ConfigHistory v-if="!isCreating" :config-key="keyName" />

    <ConfirmDialog
      v-model:visible="isDeleteOpen"
      tone="danger"
      :title="$t('admin.site.config.deleteTitle', { key: keyName })"
      :body="$t('admin.site.config.deleteBody')"
      :confirm-label="$t('admin.site.config.delete')"
      :busy="remove.isPending.value"
      @confirm="confirmDelete"
    >
      <template #error>
        <AdminStatus
          v-if="remove.failure.value"
          kind="refused"
          :text="failureTextOf(remove.failure.value)"
        />
      </template>
    </ConfirmDialog>
  </div>
</template>
