<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { createNavItem, updateNavItem } from '@/api/site-admin.api';
import type { NavigationItem } from '@/api/types/site-admin';
import { translate } from '@/i18n';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import type { FieldErrors } from '../ui/admin-errors';
import { ADMIN_INPUT_CLASS } from '../ui/classes';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { checkNavForm, navIssueTexts, navSaveRequest, toNavForm } from './nav-form';
import type { NavForm, NavSaveRequest } from './nav-form';
import { navRows, parentChoices, regexProblem } from './nav-tree';
import { writeNavigation } from './site.queries';

/** Add (`item` null) or edit one entry. The consumer keeps it mounted; it resets each time it opens. */
const props = defineProps<{ item: NavigationItem | null; items: NavigationItem[] }>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ saved: [item: NavigationItem] }>();

const queryClient = useQueryClient();
const form = ref<NavForm>(toNavForm(props.item));
const localErrors = ref<FieldErrors>({});
const title = computed(() =>
  props.item
    ? translate('admin.site.nav.dialog.editTitle', { label: props.item.label })
    : translate('admin.site.nav.dialog.addTitle'),
);

const save = useAdminMutation({
  mutate: (request: NavSaveRequest) =>
    request.kind === 'create'
      ? createNavItem(request.body)
      : updateNavItem(request.id, request.body),
  onDone: (item) => {
    writeNavigation(queryClient, item);
    emit('saved', item);
    visible.value = false;
  },
});

/** A save with nothing changed closes without a request. A refused save keeps the dialog open. */
function submit() {
  localErrors.value = checkNavForm(form.value);
  if (Object.keys(localErrors.value).length > 0) return;
  const request = navSaveRequest(props.item, form.value);
  if (request.kind === 'update' && Object.keys(request.body).length === 0) visible.value = false;
  else void save.run(request);
}

watch(visible, (isOpen) => {
  if (!isOpen) return;
  form.value = toNavForm(props.item);
  localErrors.value = {};
  save.reset();
});

const serverErrors = computed(() => navIssueTexts(save.failure.value));
const liveRegexError = computed(() => {
  const problem = regexProblem(form.value.regex);
  return problem === null
    ? undefined
    : translate('admin.site.nav.regexInvalid', { message: problem });
});
/** A field's text: this form's own check, then the backend's answer, then (for the regex) the live check. */
function errorOf(field: keyof NavForm): string | undefined {
  const live = field === 'regex' ? liveRegexError.value : undefined;
  return localErrors.value[field] ?? serverErrors.value[field] ?? live;
}

const depthById = computed(
  () => new Map(navRows(props.items).map((row) => [row.item.id, row.depth])),
);
const parentOptions = computed(() =>
  parentChoices(props.items, props.item?.id ?? null).map((choice) => ({
    id: choice.id,
    label: `${'— '.repeat(depthById.value.get(choice.id) ?? 0)}${choice.label} · ${choice.key}`,
  })),
);
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="title"
    :confirm-label="$t('admin.site.nav.dialog.save')"
    :busy="save.isPending.value"
    @confirm="submit"
  >
    <AdminField
      v-slot="{ id, describedBy }"
      :label="$t('admin.site.nav.dialog.keyLabel')"
      :hint="$t('admin.site.nav.dialog.keyHint')"
      :error="errorOf('key')"
      input-id="nav-key"
    >
      <input
        :id="id"
        v-model="form.key"
        :class="[ADMIN_INPUT_CLASS, 'font-mono']"
        :aria-describedby="describedBy"
        :aria-invalid="errorOf('key') ? 'true' : undefined"
        autocomplete="off"
      />
    </AdminField>

    <AdminField
      v-slot="{ id, describedBy }"
      :label="$t('admin.site.nav.dialog.labelLabel')"
      :hint="$t('admin.site.nav.dialog.labelHint')"
      :error="errorOf('label')"
      input-id="nav-label"
    >
      <input
        :id="id"
        v-model="form.label"
        :class="ADMIN_INPUT_CLASS"
        :aria-describedby="describedBy"
        :aria-invalid="errorOf('label') ? 'true' : undefined"
      />
    </AdminField>

    <AdminField
      v-slot="{ id, describedBy }"
      :label="$t('admin.site.nav.dialog.pathLabel')"
      :hint="$t('admin.site.nav.dialog.pathHint')"
      :error="errorOf('path')"
      input-id="nav-path"
    >
      <input
        :id="id"
        v-model="form.path"
        :class="[ADMIN_INPUT_CLASS, 'font-mono']"
        :aria-describedby="describedBy"
        :aria-invalid="errorOf('path') ? 'true' : undefined"
      />
    </AdminField>

    <AdminField
      v-slot="{ id, describedBy }"
      :label="$t('admin.site.nav.dialog.regexLabel')"
      :error="errorOf('regex')"
      input-id="nav-regex"
    >
      <input
        :id="id"
        v-model="form.regex"
        :class="[ADMIN_INPUT_CLASS, 'font-mono']"
        :aria-describedby="describedBy"
        :aria-invalid="errorOf('regex') ? 'true' : undefined"
      />
    </AdminField>

    <AdminField
      v-slot="{ id, describedBy }"
      :label="$t('admin.site.nav.dialog.parentLabel')"
      :hint="$t('admin.site.nav.dialog.parentHint')"
      :error="errorOf('parentId')"
      input-id="nav-parent"
    >
      <select
        :id="id"
        v-model="form.parentId"
        :class="ADMIN_INPUT_CLASS"
        :aria-describedby="describedBy"
        :aria-invalid="errorOf('parentId') ? 'true' : undefined"
      >
        <option value="">{{ $t('admin.site.nav.dialog.parentTop') }}</option>
        <option v-for="choice in parentOptions" :key="choice.id" :value="choice.id">
          {{ choice.label }}
        </option>
      </select>
    </AdminField>

    <AdminField
      v-slot="{ id, describedBy }"
      :label="$t('admin.site.nav.dialog.orderLabel')"
      :error="errorOf('order')"
      input-id="nav-order"
    >
      <input
        :id="id"
        v-model.number="form.order"
        type="number"
        min="0"
        max="1000000"
        :class="[ADMIN_INPUT_CLASS, 'tabular-nums']"
        :aria-describedby="describedBy"
        :aria-invalid="errorOf('order') ? 'true' : undefined"
      />
    </AdminField>

    <label class="flex min-h-11 items-center gap-2.5 text-sm">
      <input v-model="form.hidden" type="checkbox" class="size-5 accent-accent" />
      {{ $t('admin.site.nav.dialog.hiddenLabel') }}
    </label>

    <template #error>
      <AdminStatus
        v-if="save.failure.value && Object.keys(serverErrors).length === 0"
        kind="refused"
        :text="failureTextOf(save.failure.value)"
      />
    </template>
  </ConfirmDialog>
</template>
