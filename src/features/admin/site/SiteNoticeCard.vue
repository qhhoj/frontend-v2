<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed, ref, watch } from 'vue';
import { deleteConfig, putConfig } from '@/api/site-admin.api';
import Notice from '@/components/ui/Notice.vue';
import { SITE_NOTICE_KEY } from '@/features/site-notice/site-notice';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { BUTTON, CARD, INPUT } from '../ui/controls';
import AdminFormSection from '../ui/form/AdminFormSection.vue';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { translate } from '@/i18n';
import { CONFIG_VALUE_MAX } from './config-kinds';
import { refreshAfterConfigWrite, writeConfig } from './site.queries';

/** The site-wide notice every visitor sees above the page (`top_notification`, plain text): write, preview, take down. */
const props = defineProps<{ current: string | null }>();
const queryClient = useQueryClient();
const text = ref(props.current ?? '');
watch(
  () => props.current,
  (value) => (text.value = value ?? ''),
);
const preview = computed(() => text.value.trim());

const write = useAdminMutation({
  mutate: async (value: string | null) => {
    if (value === null) await deleteConfig(SITE_NOTICE_KEY);
    else await putConfig(SITE_NOTICE_KEY, value);
  },
  successText: (_answer, value) =>
    translate(value === null ? 'admin.site.notice.removed' : 'admin.site.notice.saved'),
  onDone: (_answer, value) => {
    writeConfig(queryClient, SITE_NOTICE_KEY, value);
    refreshAfterConfigWrite(queryClient);
  },
});
const tooLong = computed(() => text.value.length > CONFIG_VALUE_MAX);

function publish() {
  if (!preview.value || tooLong.value) return;
  void write.run(preview.value);
}
function takeDown() {
  void write.run(null);
}
</script>

<template>
  <form :class="CARD" novalidate @submit.prevent="publish">
    <AdminFormSection
      :title="$t('admin.site.notice.title')"
      :description="$t('admin.site.notice.lead')"
    >
      <AdminField
        v-slot="{ id, describedBy }"
        :label="$t('admin.site.notice.label')"
        :hint="$t('admin.site.notice.hint')"
        :error="tooLong ? $t('admin.site.config.errors.tooLong') : undefined"
        input-id="site-notice-text"
      >
        <textarea
          :id="id"
          v-model="text"
          rows="3"
          :class="[INPUT, 'min-h-20 resize-y py-2']"
          :aria-describedby="describedBy"
        />
      </AdminField>
      <div v-if="preview" class="flex flex-col gap-1.5">
        <span class="text-xs font-semibold text-muted">{{ $t('admin.site.notice.preview') }}</span>
        <Notice tone="info">
          <span class="block whitespace-pre-line">{{ preview }}</span>
        </Notice>
      </div>
      <div class="flex flex-wrap items-center gap-2 lg:col-span-2">
        <button
          type="submit"
          :class="BUTTON.primary"
          :aria-disabled="!preview || write.isPending.value || undefined"
        >
          {{ current ? $t('admin.site.notice.update') : $t('admin.site.notice.publish') }}
        </button>
        <button
          v-if="current !== null"
          type="button"
          :class="BUTTON.secondary"
          :aria-disabled="write.isPending.value || undefined"
          @click="write.isPending.value || takeDown()"
        >
          {{ $t('admin.site.notice.takeDown') }}
        </button>
        <AdminStatus
          v-if="write.failure.value"
          kind="refused"
          :text="failureTextOf(write.failure.value)"
        />
      </div>
    </AdminFormSection>
  </form>
</template>
