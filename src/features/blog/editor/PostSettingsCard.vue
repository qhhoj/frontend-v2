<script setup lang="ts">
import { computed } from 'vue';
import type { PostComposeOptions } from '@/api/types/blog';
import AdminField from '@/features/admin/ui/AdminField.vue';
import AdminSwitch from '@/features/admin/ui/AdminSwitch.vue';
import type { FieldErrors } from '@/features/admin/ui/admin-errors';
import { ADMIN_INPUT_CLASS } from '@/features/admin/ui/classes';
import type { PostFieldRights, PublishMode } from './post-form';

/**
 * The editor's settings column: who the post is written as (fixed once created), visibility and time, the summary
 * (`edit_all_post` only, as legacy) and the pin and newsfeed flags for those who hold them.
 */
const props = defineProps<{
  options: PostComposeOptions | undefined;
  /** Null for a new post; else the organization name of the post being edited, or '' for a personal one. */
  fixedAuthor: string | null;
  rights: PostFieldRights;
  errors: FieldErrors;
}>();
const organization = defineModel<string | null>('organization', { required: true });
const mode = defineModel<PublishMode>('mode', { required: true });
const publishOn = defineModel<string>('publishOn', { required: true });
const summary = defineModel<string>('summary', { required: true });
const sticky = defineModel<boolean>('sticky', { required: true });
const globalPost = defineModel<boolean>('globalPost', { required: true });

const organizations = computed(() => props.options?.organizations ?? []);
const canChooseSelf = computed(() => props.options?.canWritePersonal ?? true);
const postAs = computed({
  get: () => (organization.value === null ? 'self' : 'organization'),
  set: (value: 'self' | 'organization') => {
    organization.value = value === 'self' ? null : (organizations.value[0]?.slug ?? null);
  },
});
const MODES: PublishMode[] = ['draft', 'public', 'scheduled'];
const SEGMENT =
  'inline-flex min-h-10 items-center rounded-pill px-4 text-sm font-semibold text-muted has-[:checked]:bg-accent-soft has-[:checked]:text-accent-soft-text has-[:focus-visible]:outline-2';
const LABEL = 'text-xs font-bold tracking-wide text-muted uppercase';
</script>

<template>
  <section
    class="flex flex-col gap-5 rounded-panel border border-line bg-surface-solid p-4 sm:p-5"
    aria-labelledby="post-settings"
  >
    <h2 id="post-settings" class="font-display text-base font-bold text-accent-text">
      {{ $t('postEditor.settings.title') }}
    </h2>

    <div v-if="fixedAuthor !== null" class="flex flex-col gap-1.5">
      <span :class="LABEL">{{ $t('postEditor.settings.postAs') }}</span>
      <span class="font-semibold">{{ fixedAuthor || $t('postEditor.settings.self') }}</span>
    </div>
    <template v-else-if="organizations.length">
      <fieldset v-if="canChooseSelf" class="flex flex-col gap-1.5">
        <legend :class="[LABEL, 'mb-1.5']">{{ $t('postEditor.settings.postAs') }}</legend>
        <div
          class="inline-flex w-fit gap-0.5 rounded-pill border border-line-strong bg-surface-solid p-1"
        >
          <label v-for="value in ['self', 'organization'] as const" :key="value" :class="SEGMENT">
            <input v-model="postAs" type="radio" :value="value" class="sr-only" />
            {{ $t(`postEditor.settings.${value}`) }}
          </label>
        </div>
      </fieldset>
      <AdminField
        v-if="organization !== null"
        v-slot="{ id, describedBy }"
        :label="$t('postEditor.settings.organization')"
        :hint="$t('postEditor.settings.organizationHint')"
        input-id="post-organization"
      >
        <select
          :id="id"
          v-model="organization"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
        >
          <option v-for="item in organizations" :key="item.slug" :value="item.slug">
            {{ item.name }}
          </option>
        </select>
      </AdminField>
    </template>

    <fieldset class="flex flex-col gap-2">
      <legend :class="[LABEL, 'mb-1.5']">{{ $t('postEditor.settings.visibility') }}</legend>
      <label
        v-for="value in MODES"
        :key="value"
        class="flex cursor-pointer items-start gap-3 rounded-row border border-line px-3 py-2.5 has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
      >
        <input v-model="mode" type="radio" :value="value" class="mt-1 accent-accent" />
        <span class="flex flex-col">
          <span class="font-semibold">{{ $t(`postEditor.mode.${value}`) }}</span>
          <span class="text-xs text-muted">{{ $t(`postEditor.modeHint.${value}`) }}</span>
        </span>
      </label>
    </fieldset>

    <AdminField
      v-if="mode === 'scheduled'"
      v-slot="{ id, describedBy, invalid }"
      :label="$t('postEditor.settings.publishOn')"
      :error="errors.publishOn"
      input-id="post-publish-on"
    >
      <input
        :id="id"
        v-model="publishOn"
        type="datetime-local"
        :class="ADMIN_INPUT_CLASS"
        :aria-describedby="describedBy"
        :aria-invalid="invalid ? 'true' : undefined"
      />
    </AdminField>

    <AdminField
      v-slot="{ id, describedBy }"
      :label="$t('postEditor.settings.summary')"
      :hint="
        $t(rights.staff ? 'postEditor.settings.summaryHint' : 'postEditor.settings.summaryLocked')
      "
      :error="errors.summary"
      input-id="post-summary"
    >
      <textarea
        :id="id"
        v-model="summary"
        rows="3"
        :disabled="!rights.staff"
        :class="[ADMIN_INPUT_CLASS, 'py-2 text-sm disabled:text-muted']"
        :aria-describedby="describedBy"
      />
    </AdminField>

    <AdminSwitch
      v-if="rights.pin"
      v-model="sticky"
      :label="$t('postEditor.settings.sticky')"
      :description="$t('postEditor.settings.stickyHint')"
    />
    <AdminSwitch
      v-if="rights.markGlobal"
      v-model="globalPost"
      :label="$t('admin.postEditor.fields.globalPost')"
      :description="$t('admin.postEditor.hints.globalPost')"
    />
  </section>
</template>
