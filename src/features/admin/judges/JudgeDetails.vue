<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import AdminField from '../ui/AdminField.vue';
import { INPUT, buttonClass } from '../ui/controls';
import type { Judge } from '@/api/types/judges-admin';
import JudgeRuntimes from './JudgeRuntimes.vue';
import { JUDGE_DESCRIPTION_MAX, trimmedDescription } from './judge-stats';

const props = defineProps<{ judge: Judge; isSaving: boolean }>();
const emit = defineEmits<{ saveDescription: [description: string] }>();
const locale = useLocaleStore();
const { t } = useI18n();
const draft = ref(props.judge.description);
const isTooLong = computed(() => draft.value.length > JUDGE_DESCRIPTION_MAX);
const tooLongText = computed(() =>
  isTooLong.value ? t('admin.judges.add.descriptionTooLong') : undefined,
);
/** A description over the limit is never sent: the field says why, and the save stays with the user. */
function save() {
  if (!isTooLong.value) emit('saveDescription', trimmedDescription(draft.value));
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <p v-if="judge.startTime" class="text-sm text-muted">
      {{
        $t('admin.judges.row.started', {
          time: formatDate(judge.startTime, 'datetime', locale.locale),
        })
      }}
    </p>
    <dl class="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
      <dt class="text-muted">{{ $t('admin.judges.row.protocol') }}</dt>
      <dd class="font-mono">v1.{{ judge.protocolMinor }}</dd>
      <dt class="text-muted">{{ $t('admin.judges.row.features') }}</dt>
      <dd class="font-mono break-words">{{ judge.features.join(', ') || '—' }}</dd>
      <dt class="text-muted">{{ $t('admin.judges.row.lastIp') }}</dt>
      <dd class="font-mono">{{ judge.lastIp ?? '—' }}</dd>
    </dl>
    <JudgeRuntimes :runtimes="judge.runtimes" />
    <form class="flex flex-col gap-3" @submit.prevent="save">
      <AdminField
        v-slot="{ id, describedBy }"
        :label="$t('admin.judges.row.descriptionLabel')"
        :input-id="`judge-description-${judge.name}`"
        :error="tooLongText"
      >
        <textarea
          :id="id"
          v-model="draft"
          rows="2"
          :aria-describedby="describedBy"
          :class="INPUT"
        />
      </AdminField>
      <div>
        <button type="submit" :class="buttonClass()" :aria-busy="isSaving || undefined">
          {{ $t('common.save') }}
        </button>
      </div>
    </form>
  </div>
</template>
