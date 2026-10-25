<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RouteLocationNormalized } from 'vue-router';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import QueryState from '@/components/QueryState.vue';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import type { FlatpageRevision } from '@/api/types/flatpages-admin';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { BUTTON, CARD, INPUT } from '../ui/controls';
import AdminNotice from '../ui/feedback/AdminNotice.vue';
import AdminFormSection from '../ui/form/AdminFormSection.vue';
import AdminLeaveDialog from '../ui/form/AdminLeaveDialog.vue';
import AdminLeaveGuard from '../ui/form/AdminLeaveGuard.vue';
import AdminSaveBar from '../ui/form/AdminSaveBar.vue';
import { useQueryLeaveGuard } from '../ui/form/use-query-leave-guard';
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
const { form, saved, writer, remover, fieldErrors, dirtyCount } = editor;
const isConfirmOpen = ref(false);
/**
 * Picking another page (or a deleted one) from the list only changes the query; it replaces this form's content. The
 * move from "new" to the page's own id right after its create is the save's own navigation, not a leave.
 */
const leavesPage = (to: RouteLocationNormalized, from: RouteLocationNormalized) =>
  !(writer.isDone.value && from.query.page === 'new') &&
  (to.query.page !== from.query.page || to.query.deleted !== from.query.deleted);
const queryGuard = useQueryLeaveGuard(() => dirtyCount.value > 0, leavesPage);
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
    ? t('admin.pages.history.loaded', {
        time: formatDate(loadedAt.value, 'datetime', localeStore.locale),
      })
    : '',
);
/** "Đã lưu lúc 14:02" in the save bar, for the page on screen (kept when a new page opens at its id after its create). */
const savedAt = ref<Date | null>(null);
watch(
  () => props.pageId,
  (_id, previousId) => {
    loadedAt.value = null;
    if (previousId !== null) savedAt.value = null;
  },
);
watch(
  () => writer.isDone.value,
  (isDone) => {
    if (!isDone) return;
    loadedAt.value = null;
    savedAt.value = new Date();
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
    <form class="flex flex-col gap-4" novalidate @submit.prevent="editor.save()">
      <div :class="[CARD, 'flex flex-col gap-5 p-4 sm:p-5']">
        <div class="grid gap-4 md:grid-cols-2">
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
              :class="INPUT"
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
              :class="INPUT"
              :aria-describedby="describedBy"
              :aria-invalid="invalid ? 'true' : undefined"
            />
          </AdminField>
        </div>
        <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
              :class="[INPUT, 'py-2 font-mono text-sm']"
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
        <label class="flex items-start gap-3 text-sm">
          <input
            v-model="registrationRequired"
            type="checkbox"
            class="mt-0.5 size-4 accent-[var(--qh-accent)]"
          />
          <span>{{ t('admin.pages.field.registrationRequired') }}</span>
        </label>
      </div>

      <AdminNotice v-if="loadedNote" :title="loadedNote" />
      <AdminStatus
        v-if="writer.failure.value && !fieldErrors.url"
        kind="refused"
        :text="failureTextOf(writer.failure.value)"
      />

      <AdminSaveBar
        class="mx-0! rounded-b-row px-4!"
        :dirty-count="dirtyCount"
        :pending="writer.isPending.value"
        :saved-at="savedAt"
        :save-label="t('common.save')"
        @discard="editor.discard()"
      />
      <AdminLeaveGuard :dirty-count="dirtyCount" />
      <AdminLeaveDialog
        v-model:visible="queryGuard.isLeaveOpen.value"
        :count="dirtyCount"
        @leave="queryGuard.leaveAnyway"
      />
    </form>

    <section
      v-if="canDelete"
      :class="[CARD, 'mt-4 border-negative']"
      :aria-label="t('admin.pages.delete.zone')"
    >
      <AdminFormSection
        danger
        :columns="1"
        :title="t('admin.pages.delete.zone')"
        :description="t('admin.pages.delete.body')"
      >
        <div>
          <button type="button" :class="BUTTON.danger" @click="isConfirmOpen = true">
            {{ t('admin.pages.delete.open') }}
          </button>
        </div>
      </AdminFormSection>
    </section>

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
