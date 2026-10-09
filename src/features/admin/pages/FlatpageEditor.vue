<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import QueryState from '@/components/QueryState.vue';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import { formatDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import type { FlatpageRevision } from '@/api/types/flatpages-admin';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import AdminSwitch from '../ui/AdminSwitch.vue';
import {
  ADMIN_BUTTON_CLASS,
  ADMIN_DANGER_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_PRIMARY_CLASS,
} from '../ui/classes';
import { failureTextOf } from '../ui/admin-errors';
import FlatpagePreview from './FlatpagePreview.vue';
import { prefillOf } from './flatpage-history';
import { useFlatpageEditor } from './use-flatpage-editor';

const props = defineProps<{ pageId: string | null }>();
const emit = defineEmits<{ created: [id: string]; deleted: [] }>();
const { t } = useI18n();
const { can } = usePermissions();
const editor = useFlatpageEditor({
  pageId: () => props.pageId,
  onCreated: (id) => emit('created', id),
  onDeleted: () => emit('deleted'),
});
const localeStore = useLocaleStore();
const { form, saved, writer, remover, fieldErrors } = editor;
const isConfirmOpen = ref(false);
const titleInput = ref<HTMLInputElement | null>(null);
/** The stored flag is optional; the switch needs a plain boolean. */
const registrationRequired = computed({
  get: () => form.registrationRequired === true,
  set: (isRequired: boolean) => (form.registrationRequired = isRequired),
});
/** Set by "Nạp giá trị cũ": the form holds an old value that is not saved yet, and the note says which version it came from. */
const loadedAt = ref<string | null>(null);
const loadedNote = computed(() =>
  loadedAt.value
    ? t('admin.pages.history.loaded', { time: formatDateTime(loadedAt.value, localeStore.locale) })
    : '',
);
watch(
  () => props.pageId,
  () => (loadedAt.value = null),
);
watch(
  () => writer.isDone.value,
  (isDone) => {
    if (isDone) loadedAt.value = null;
  },
);
const canDelete = computed(() => props.pageId !== null && can('flatpages.delete_flatpage'));
const isLoading = computed(() => props.pageId !== null && editor.pageQuery.isPending.value);

async function removePage() {
  await remover.run(props.pageId!);
  isConfirmOpen.value = false;
}

/** Fills the form with the values before `changes` (not saved); the title gets the focus so the user sees the change. */
function loadOldValues(changes: FlatpageRevision['changes'], at: string) {
  Object.assign(form, prefillOf(form, changes));
  loadedAt.value = at;
  focusTitle();
}

function focusTitle() {
  void nextTick(() => titleInput.value?.focus());
}

defineExpose({ loadOldValues, focusTitle });
</script>

<template>
  <QueryState
    :loading="isLoading"
    :error="editor.pageQuery.error.value"
    @retry="editor.pageQuery.refetch()"
  >
    <form
      class="flex flex-col gap-5 rounded-panel border border-line bg-surface-solid p-5"
      novalidate
      @submit.prevent="editor.save()"
    >
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        :label="t('admin.pages.field.url')"
        :hint="t('admin.pages.field.urlHint')"
        :error="fieldErrors.url"
        input-id="page-url"
      >
        <input
          :id="id"
          v-model="form.url"
          type="text"
          class="font-mono"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        :label="t('admin.pages.field.title')"
        :hint="t('admin.pages.field.titleHint')"
        :error="fieldErrors.title"
        input-id="page-title"
      >
        <input
          :id="id"
          ref="titleInput"
          v-model="form.title"
          type="text"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
        />
      </AdminField>
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminField
          v-slot="{ describedBy, invalid }"
          :label="t('admin.pages.field.content')"
          :hint="t('admin.pages.field.contentHint')"
          :error="fieldErrors.content"
          input-id="page-content"
        >
          <textarea
            id="page-content"
            v-model="form.content"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
            rows="16"
            class="w-full rounded-row border border-line-strong bg-surface-solid p-3 font-mono text-sm text-content"
          />
          <p class="text-xs text-muted">
            {{ t('admin.pages.field.contentCount', { length: form.content.length }) }}
          </p>
        </AdminField>
        <FlatpagePreview
          :content="form.content"
          :saved-content="saved ? saved.content : null"
          :saved-html="saved?.contentHtml ?? ''"
        />
      </div>
      <AdminSwitch
        v-model="registrationRequired"
        :label="t('admin.pages.field.registrationRequired')"
      />

      <SettingsNotice v-if="loadedNote" tone="info">{{ loadedNote }}</SettingsNotice>
      <AdminStatus v-if="writer.isDone.value" kind="done" :text="t('admin.pages.saved')" />
      <AdminStatus
        v-else-if="editor.isNothingToSave.value"
        kind="done"
        :text="t('admin.pages.unchanged')"
      />
      <AdminStatus
        v-else-if="writer.failure.value && !fieldErrors.url"
        kind="refused"
        :text="failureTextOf(writer.failure.value)"
      />

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          :class="ADMIN_PRIMARY_CLASS"
          :aria-busy="writer.isPending.value || undefined"
        >
          {{ t('admin.pages.save') }}
        </button>
        <button type="button" :class="ADMIN_BUTTON_CLASS" @click="editor.discard()">
          {{ t('admin.pages.discard') }}
        </button>
        <button
          v-if="canDelete"
          type="button"
          :class="ADMIN_DANGER_CLASS"
          @click="isConfirmOpen = true"
        >
          {{ t('admin.pages.delete.open') }}
        </button>
      </div>
    </form>

    <ConfirmDialog
      v-if="canDelete"
      v-model:visible="isConfirmOpen"
      tone="danger"
      :title="t('admin.pages.delete.title', { url: saved?.url ?? '' })"
      :body="t('admin.pages.delete.body')"
      :confirm-label="t('admin.pages.delete.confirm')"
      :busy="remover.isPending.value"
      @confirm="removePage"
    >
      <template #error>
        <p v-if="remover.failure.value" role="alert" class="text-sm text-negative">
          {{ failureTextOf(remover.failure.value) }}
        </p>
      </template>
    </ConfirmDialog>
  </QueryState>
</template>
