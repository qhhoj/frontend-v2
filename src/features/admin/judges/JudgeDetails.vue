<script setup lang="ts">
import { ref } from 'vue';
import { formatDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminField from '../ui/AdminField.vue';
import { ADMIN_BUTTON_CLASS, ADMIN_INPUT_CLASS } from '../ui/classes';
import type { Judge } from '@/api/types/judges-admin';
import JudgeRuntimes from './JudgeRuntimes.vue';

const props = defineProps<{ judge: Judge; isSaving: boolean }>();
const emit = defineEmits<{ saveDescription: [description: string] }>();
const locale = useLocaleStore();
const draft = ref(props.judge.description);
</script>

<template>
  <div class="flex flex-col gap-5 border-t border-line pt-4">
    <p v-if="judge.startTime" class="text-sm text-muted">
      {{
        $t('admin.judges.row.started', {
          time: formatDateTime(judge.startTime, locale.locale),
        })
      }}
    </p>
    <JudgeRuntimes :runtimes="judge.runtimes" />
    <form class="flex flex-col gap-3" @submit.prevent="emit('saveDescription', draft)">
      <AdminField
        v-slot="{ id, describedBy }"
        :label="$t('admin.judges.row.descriptionLabel')"
        :input-id="`judge-description-${judge.name}`"
      >
        <textarea
          :id="id"
          v-model="draft"
          rows="2"
          :aria-describedby="describedBy"
          :class="ADMIN_INPUT_CLASS"
        />
      </AdminField>
      <div>
        <button type="submit" :class="ADMIN_BUTTON_CLASS" :aria-busy="isSaving || undefined">
          {{ $t('admin.judges.row.saveDescription') }}
        </button>
      </div>
    </form>
  </div>
</template>
