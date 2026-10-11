<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import { createContestTag, updateContestTag } from '@/api/contest-tags.api';
import type { ContestTag } from '@/api/types/contest-tags';
import { CONTEST_TAGS_KEY } from '@/features/contests/contest-extras.queries';
import { translate } from '@/i18n';
import AdminDrawer from '../ui/AdminDrawer.vue';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf, isConflict } from '../ui/admin-errors';
import type { FieldErrors } from '../ui/admin-errors';
import { INPUT, buttonClass } from '../ui/controls';
import { useAdminMutation } from '../ui/use-admin-mutation';
import ColorTokenPicker from './ColorTokenPicker.vue';
import { checkTagForm, emptyTagForm, tagFormOf, toTagBody, toTagPatch } from './contest-tag-form';
import type { ContestTagForm } from './contest-tag-form';

/** The drawer that creates (`tag` null) or edits one tag; it closes itself after a save. */
const props = defineProps<{ tag: ContestTag | null }>();
const visible = defineModel<boolean>('visible', { required: true });
const formId = useId();
const form = ref<ContestTagForm>(emptyTagForm());
const hasTried = ref(false);
const isCreate = computed(() => props.tag === null);
const localErrors = computed(() =>
  hasTried.value ? checkTagForm(form.value, isCreate.value) : {},
);
/** Every opening starts from the tag (or an empty form) and a clean slate. */
watch(visible, (isOpen) => {
  if (!isOpen) return;
  form.value = props.tag ? tagFormOf(props.tag) : emptyTagForm();
  hasTried.value = false;
  mutation.reset();
});

const mutation = useAdminMutation({
  mutate: (sent: ContestTagForm) =>
    props.tag
      ? updateContestTag(props.tag.slug, toTagPatch(props.tag, sent))
      : createContestTag(toTagBody(sent)),
  invalidates: () => [CONTEST_TAGS_KEY],
  successText: () =>
    translate(isCreate.value ? 'admin.contestTags.created' : 'admin.contestTags.saved'),
  onDone: () => {
    visible.value = false;
  },
});
/** Creating a tag whose key exists answers a bare 409 `conflict` (no issue): the key is taken. */
const isSlugTaken = computed(() => {
  const failure = mutation.failure.value;
  return isCreate.value && isConflict(failure) && failure.issues.length === 0;
});
const errors = computed<FieldErrors>(() => ({
  ...localErrors.value,
  ...mutation.fieldErrors.value,
  ...(isSlugTaken.value ? { slug: translate('admin.contestTags.errors.slugTaken') } : {}),
}));

async function save() {
  hasTried.value = true;
  if (Object.keys(checkTagForm(form.value, isCreate.value)).length) return;
  await mutation.run({ ...form.value });
}
</script>

<template>
  <AdminDrawer
    v-model:visible="visible"
    :title="
      tag
        ? $t('admin.contestTags.editTitle', { name: tag.name })
        : $t('admin.contestTags.createTitle')
    "
    :subtitle="tag?.slug"
  >
    <div data-testid="tag-editor" class="flex flex-col gap-4">
      <form :id="formId" class="grid gap-4" novalidate @submit.prevent="save">
        <AdminField
          input-id="contest-tag-slug"
          :label="$t('admin.contestTags.fields.slug')"
          :hint="
            isCreate ? $t('admin.contestTags.hints.slug') : $t('admin.contestTags.hints.slugFixed')
          "
          :error="errors.slug"
          :required="isCreate"
        >
          <template #default="{ id, describedBy, invalid }">
            <input
              :id="id"
              v-model="form.slug"
              :readonly="!isCreate"
              :autofocus="isCreate || undefined"
              maxlength="20"
              autocomplete="off"
              spellcheck="false"
              :class="[INPUT, 'font-mono', !isCreate && 'bg-surface-strong text-muted']"
              :aria-describedby="describedBy"
              :aria-invalid="invalid ? 'true' : undefined"
            />
          </template>
        </AdminField>
        <AdminField
          input-id="contest-tag-name"
          :label="$t('admin.contestTags.fields.name')"
          :error="errors.name"
          required
        >
          <template #default="{ id, describedBy, invalid }">
            <input
              :id="id"
              v-model="form.name"
              :autofocus="!isCreate || undefined"
              maxlength="40"
              :class="INPUT"
              :aria-describedby="describedBy"
              :aria-invalid="invalid ? 'true' : undefined"
            />
          </template>
        </AdminField>
        <AdminField
          input-id="contest-tag-description"
          :label="$t('admin.contestTags.fields.description')"
          :error="errors.description"
        >
          <template #default="{ id, describedBy, invalid }">
            <input
              :id="id"
              v-model="form.description"
              maxlength="200"
              :class="INPUT"
              :aria-describedby="describedBy"
              :aria-invalid="invalid ? 'true' : undefined"
            />
          </template>
        </AdminField>
        <AdminField
          input-id="contest-tag-order"
          :label="$t('admin.contestTags.fields.order')"
          :hint="$t('admin.contestTags.hints.order')"
          :error="errors.order"
        >
          <template #default="{ id, describedBy, invalid }">
            <input
              :id="id"
              v-model.number="form.order"
              type="number"
              min="-1000"
              max="1000"
              step="1"
              :class="[INPUT, 'max-w-40 font-mono tabular-nums']"
              :aria-describedby="describedBy"
              :aria-invalid="invalid ? 'true' : undefined"
            />
          </template>
        </AdminField>
        <ColorTokenPicker
          v-model="form.color"
          :label="$t('admin.contestTags.fields.color')"
          :sample="form.name.trim()"
        />
      </form>
      <AdminStatus
        v-if="mutation.failure.value && !isSlugTaken"
        kind="refused"
        :text="failureTextOf(mutation.failure.value)"
      />
    </div>
    <template #footer>
      <button type="button" :class="[buttonClass('ghost'), 'ml-auto']" @click="visible = false">
        {{ $t('admin.contestTags.cancel') }}
      </button>
      <button
        type="submit"
        :form="formId"
        :class="buttonClass('primary')"
        :aria-busy="mutation.isPending.value || undefined"
      >
        {{ isCreate ? $t('admin.contestTags.create') : $t('admin.contestTags.save') }}
      </button>
    </template>
  </AdminDrawer>
</template>
