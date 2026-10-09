<script setup lang="ts">
import { computed } from 'vue';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { ADMIN_BUTTON_CLASS } from '../../ui/classes';
import { useProblemPackage } from './use-problem-package';

/** "Tải gói đề": build the full package, then offer it as a download link (no automatic navigation). */
const props = defineProps<{ code: string }>();
const { phase, failureText, start, downloadUrl } = useProblemPackage(() => props.code);
const isBusy = computed(() => phase.value === 'requesting' || phase.value === 'building');
</script>

<template>
  <SettingsCard :title="$t('admin.package.title')" :lead="$t('admin.package.lead')">
    <div data-testid="problem-package" class="flex flex-col gap-3">
      <div>
        <button
          type="button"
          :class="ADMIN_BUTTON_CLASS"
          :aria-disabled="isBusy ? 'true' : undefined"
          :aria-busy="isBusy || undefined"
          @click="start"
        >
          {{ $t('admin.package.button') }}
        </button>
      </div>
      <AdminStatus v-if="isBusy" kind="queued" :text="$t('admin.package.building')" />
      <AdminStatus v-else-if="phase === 'ready'" kind="done" :text="$t('admin.package.ready')">
        <a
          :href="downloadUrl"
          :download="`${code}.zip`"
          class="inline-flex min-h-11 items-center font-semibold text-accent-text underline"
          >{{ $t('admin.package.download', { code }) }}</a
        >
      </AdminStatus>
      <AdminStatus v-else-if="phase === 'failed'" kind="refused" :text="failureText" />
    </div>
  </SettingsCard>
</template>
