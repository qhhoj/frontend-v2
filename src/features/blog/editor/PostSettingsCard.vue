<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { PostComposeOptions } from '@/api/types/blog';
import Card from '@/components/ui/Card.vue';
import Checkbox from '@/components/ui/Checkbox.vue';
import DateTimeField from '@/components/ui/DateTimeField.vue';
import FormField from '@/components/ui/FormField.vue';
import RadioGroup from '@/components/ui/RadioGroup.vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import SelectField from '@/components/ui/SelectField.vue';
import TextArea from '@/components/ui/TextArea.vue';
import type { FieldErrors } from '@/features/admin/ui/admin-errors';
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

const { t } = useI18n();
const organizations = computed(() => props.options?.organizations ?? []);
const canChooseSelf = computed(() => props.options?.canWritePersonal ?? true);
const postAs = computed({
  get: () => (organization.value === null ? 'self' : 'organization'),
  set: (value: 'self' | 'organization') => {
    organization.value = value === 'self' ? null : (organizations.value[0]?.slug ?? null);
  },
});
/** The organization select, shown only while one is chosen. */
const chosenOrganization = computed({
  get: () => organization.value ?? '',
  set: (slug: string | number) => (organization.value = String(slug)),
});
/** `DateTimeField` takes an instant or null; the form keeps '' for "now". */
const publishAt = computed({
  get: () => publishOn.value || null,
  set: (iso: string | null) => (publishOn.value = iso ?? ''),
});
const MODES: PublishMode[] = ['draft', 'public', 'scheduled'];
const modeOptions = computed(() =>
  MODES.map((value) => ({
    value,
    label: t(`postEditor.mode.${value}`),
    description: t(`postEditor.modeHint.${value}`),
  })),
);
const postAsOptions = computed(() =>
  (['self', 'organization'] as const).map((value) => ({
    value,
    label: t(`postEditor.settings.${value}`),
  })),
);
const LABEL = 'text-meta font-semibold text-muted';
</script>

<template>
  <Card padding="md" :title="$t('postEditor.settings.title')">
    <div class="flex flex-col gap-5">
      <div v-if="fixedAuthor !== null" class="flex flex-col gap-1.5">
        <span :class="LABEL">{{ $t('postEditor.settings.postAs') }}</span>
        <span class="font-semibold">{{ fixedAuthor || $t('postEditor.settings.self') }}</span>
      </div>
      <template v-else-if="organizations.length">
        <SegmentedControl
          v-if="canChooseSelf"
          v-model="postAs"
          :label="$t('postEditor.settings.postAs')"
          :options="postAsOptions"
        />
        <FormField
          v-if="organization !== null"
          :label="$t('postEditor.settings.organization')"
          :hint="$t('postEditor.settings.organizationHint')"
          input-id="post-organization"
        >
          <SelectField v-model="chosenOrganization">
            <option v-for="item in organizations" :key="item.slug" :value="item.slug">
              {{ item.name }}
            </option>
          </SelectField>
        </FormField>
      </template>

      <RadioGroup
        v-model="mode"
        name="post-visibility"
        :legend="$t('postEditor.settings.visibility')"
        :options="modeOptions"
      />

      <DateTimeField
        v-if="mode === 'scheduled'"
        v-model="publishAt"
        :label="$t('postEditor.settings.publishOn')"
        :error="errors.publishOn"
        input-id="post-publish-on"
      />

      <FormField
        :label="$t('postEditor.settings.summary')"
        :hint="
          $t(rights.staff ? 'postEditor.settings.summaryHint' : 'postEditor.settings.summaryLocked')
        "
        :error="errors.summary"
        input-id="post-summary"
      >
        <TextArea v-model="summary" rows="3" :disabled="!rights.staff" />
      </FormField>

      <Checkbox
        v-if="rights.pin"
        v-model="sticky"
        :label="$t('postEditor.settings.sticky')"
        :description="$t('postEditor.settings.stickyHint')"
      />
      <Checkbox
        v-if="rights.markGlobal"
        v-model="globalPost"
        :label="$t('postEditor.fields.globalPost')"
        :description="$t('postEditor.hints.globalPost')"
      />
    </div>
  </Card>
</template>
