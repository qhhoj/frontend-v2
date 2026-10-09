<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ProblemTag } from '@/api/types/organization-problems';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { ORGANIZATION_TAG_COLORS } from './org-tag-classes';
import { emptyTagForm, tagFormErrors, tagFormOf } from './org-tag-form';
import type { TagForm } from './org-tag-form';
import OrgTagChip from './OrgTagChip.vue';

/** Create (`tag` null) or edit one tag; the draft is checked before `save` is emitted. */
const props = defineProps<{ tag: ProblemTag | null; busy: boolean; failureText: string }>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ save: [form: TagForm] }>();
const form = ref<TagForm>(emptyTagForm());
const errors = ref<{ slug?: string; name?: string }>({});
watch(visible, (isOpen) => {
  if (!isOpen) return;
  form.value = props.tag ? tagFormOf(props.tag) : emptyTagForm();
  errors.value = {};
});
function submit() {
  errors.value = tagFormErrors(form.value, props.tag === null);
  if (Object.keys(errors.value).length === 0) emit('save', { ...form.value });
}
const INPUT =
  'min-h-11 w-full rounded-row border border-line-strong bg-surface-solid px-3 text-content';
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="
      tag
        ? $t('orgProblems.tags.editTitle', { name: tag.name })
        : $t('orgProblems.tags.createTitle')
    "
    :confirm-label="$t('orgProblems.tags.save')"
    :busy="busy"
    @confirm="submit"
  >
    <div v-if="!tag" class="flex flex-col gap-1.5">
      <label for="org-tag-slug" class="text-sm font-semibold">{{
        $t('orgProblems.tags.slug')
      }}</label>
      <input
        id="org-tag-slug"
        v-model.trim="form.slug"
        :class="INPUT"
        class="font-mono"
        maxlength="20"
        autocomplete="off"
        :aria-invalid="errors.slug ? 'true' : undefined"
        aria-describedby="org-tag-slug-hint org-tag-slug-error"
      />
      <p id="org-tag-slug-hint" class="text-xs text-muted">{{ $t('orgProblems.tags.slugHint') }}</p>
      <p id="org-tag-slug-error" class="text-sm text-negative">
        {{ errors.slug ? $t(errors.slug) : '' }}
      </p>
    </div>
    <p v-else class="text-sm text-muted">
      {{ $t('orgProblems.tags.slugFixed', { slug: tag.slug }) }}
    </p>
    <div class="flex flex-col gap-1.5">
      <label for="org-tag-name" class="text-sm font-semibold">{{
        $t('orgProblems.tags.name')
      }}</label>
      <input
        id="org-tag-name"
        v-model="form.name"
        :class="INPUT"
        maxlength="40"
        autocomplete="off"
        :aria-invalid="errors.name ? 'true' : undefined"
        aria-describedby="org-tag-name-error"
      />
      <p id="org-tag-name-error" class="text-sm text-negative">
        {{ errors.name ? $t(errors.name) : '' }}
      </p>
    </div>
    <fieldset class="flex flex-col gap-2">
      <legend class="mb-1 text-sm font-semibold">{{ $t('orgProblems.tags.color') }}</legend>
      <div class="flex flex-wrap gap-2">
        <label
          v-for="(color, index) in ORGANIZATION_TAG_COLORS"
          :key="color"
          class="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border border-line px-2 has-checked:border-accent"
        >
          <input
            v-model="form.color"
            type="radio"
            name="org-tag-color"
            class="size-4"
            :value="color"
            :aria-label="$t('orgProblems.tags.colorName', { number: index + 1 })"
          />
          <OrgTagChip
            aria-hidden="true"
            :tag="{
              name: form.name.trim() || $t('orgProblems.tags.colorName', { number: index + 1 }),
              color,
            }"
          />
        </label>
      </div>
    </fieldset>
    <template #error>
      <p v-if="failureText" role="alert" class="text-sm text-negative">{{ failureText }}</p>
    </template>
  </ConfirmDialog>
</template>
