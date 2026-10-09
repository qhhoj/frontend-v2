<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { createContestTag, updateContestTag } from '@/api/contest-tags.api';
import type { ContestTag } from '@/api/types/contest-tags';
import { CONTEST_TAGS_KEY } from '@/features/contests/contest-extras.queries';
import { translate } from '@/i18n';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { ADMIN_BUTTON_CLASS, ADMIN_INPUT_CLASS, ADMIN_PRIMARY_CLASS } from '../ui/classes';
import { useAdminMutation } from '../ui/use-admin-mutation';
import ColorTokenPicker from './ColorTokenPicker.vue';
import { checkTagForm, emptyTagForm, tagFormOf, toTagBody, toTagPatch } from './contest-tag-form';
import type { ContestTagForm } from './contest-tag-form';

/** Create (`tag` null) or edit one tag; `done` asks the page to leave edit mode. */
const props = defineProps<{ tag: ContestTag | null; isFull: boolean }>();
const emit = defineEmits<{ done: [] }>();
const form = ref<ContestTagForm>(props.tag ? tagFormOf(props.tag) : emptyTagForm());
const hasTried = ref(false);
const isCreate = computed(() => props.tag === null);
const localErrors = computed(() =>
  hasTried.value ? checkTagForm(form.value, isCreate.value) : {},
);
watch(
  () => props.tag,
  (tag) => {
    form.value = tag ? tagFormOf(tag) : emptyTagForm();
    hasTried.value = false;
  },
);

const mutation = useAdminMutation({
  mutate: (sent: ContestTagForm) =>
    props.tag
      ? updateContestTag(props.tag.slug, toTagPatch(props.tag, sent))
      : createContestTag(toTagBody(sent)),
  invalidates: () => [CONTEST_TAGS_KEY],
  onDone: () => {
    if (isCreate.value) form.value = emptyTagForm();
    hasTried.value = false;
    emit('done');
  },
});
const errors = computed(() => ({ ...localErrors.value, ...mutation.fieldErrors.value }));
const doneText = computed(() =>
  translate(isCreate.value ? 'admin.contestTags.created' : 'admin.contestTags.saved'),
);

async function save() {
  hasTried.value = true;
  if (Object.keys(checkTagForm(form.value, isCreate.value)).length) return;
  await mutation.run({ ...form.value });
}
</script>

<template>
  <section data-testid="tag-editor" class="glass flex flex-col gap-4 rounded-panel p-5">
    <h2 class="font-display text-lg font-semibold">
      {{
        tag
          ? $t('admin.contestTags.editTitle', { name: tag.name })
          : $t('admin.contestTags.createTitle')
      }}
    </h2>
    <p v-if="isCreate && isFull" class="text-sm text-muted">{{ $t('admin.contestTags.full') }}</p>
    <form v-else class="grid gap-4 md:grid-cols-2" novalidate @submit.prevent="save">
      <AdminField
        input-id="contest-tag-slug"
        :label="$t('admin.contestTags.fields.slug')"
        :hint="
          isCreate ? $t('admin.contestTags.hints.slug') : $t('admin.contestTags.hints.slugFixed')
        "
        :error="errors.slug"
      >
        <template #default="{ id, describedBy, invalid }">
          <input
            :id="id"
            v-model="form.slug"
            :readonly="!isCreate"
            maxlength="20"
            autocomplete="off"
            :class="[ADMIN_INPUT_CLASS, 'font-mono']"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
          />
        </template>
      </AdminField>
      <AdminField
        input-id="contest-tag-name"
        :label="$t('admin.contestTags.fields.name')"
        :error="errors.name"
      >
        <template #default="{ id, describedBy, invalid }">
          <input
            :id="id"
            v-model="form.name"
            maxlength="40"
            :class="ADMIN_INPUT_CLASS"
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
            :class="ADMIN_INPUT_CLASS"
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
            :class="ADMIN_INPUT_CLASS"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
          />
        </template>
      </AdminField>
      <div class="md:col-span-2">
        <ColorTokenPicker
          v-model="form.color"
          :label="$t('admin.contestTags.fields.color')"
          :sample="form.name.trim()"
        />
      </div>
      <div class="flex flex-wrap items-center gap-3 md:col-span-2">
        <button
          type="submit"
          :class="ADMIN_PRIMARY_CLASS"
          :aria-busy="mutation.isPending.value || undefined"
        >
          {{ isCreate ? $t('admin.contestTags.create') : $t('admin.contestTags.save') }}
        </button>
        <button v-if="!isCreate" type="button" :class="ADMIN_BUTTON_CLASS" @click="emit('done')">
          {{ $t('admin.contestTags.cancel') }}
        </button>
      </div>
    </form>
    <AdminStatus v-if="mutation.isDone.value" kind="done" :text="doneText" />
    <AdminStatus
      v-if="mutation.failure.value"
      kind="refused"
      :text="failureTextOf(mutation.failure.value)"
    />
  </section>
</template>
