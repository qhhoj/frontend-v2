<script setup lang="ts">
import { computed, ref } from 'vue';
import { Activity } from 'lucide-vue-next';
import { testExternalJudgeConnection } from '@/api/external-judge.api';
import type { ExternalJudgeTestResult } from '@/api/types/external-judge';
import type { Setting } from '@/api/types/settings-admin';
import { formatClock } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { BUTTON } from '../ui/controls';
import { useAdminMutation } from '../ui/use-admin-mutation';

/** Under the External judge block: lists the OJs the saved connection serves, and warns about a plain-http address. */
const props = defineProps<{ settings: Setting[] }>();
const locale = useLocaleStore();
const isPlainHttp = computed(() => {
  const value = props.settings.find((entry) => entry.key === 'externalJudge.baseUrl')?.value;
  return typeof value === 'string' && value.startsWith('http://');
});
const checkedAt = ref('');
const result = ref<ExternalJudgeTestResult | null>(null);
const check = useAdminMutation({
  mutate: () => {
    result.value = null;
    return testExternalJudgeConnection();
  },
  onSuccess: (answer) => (result.value = answer),
});

function run() {
  checkedAt.value = formatClock(new Date().toISOString(), locale.locale);
  void check.run(undefined);
}
</script>

<template>
  <div class="flex flex-col gap-4 border-t border-line pt-4">
    <AdminStatus
      v-if="isPlainHttp"
      kind="refused"
      data-testid="external-judge-http-warning"
      :text="$t('admin.externalJudge.check.httpWarning')"
    />
    <div class="flex flex-wrap items-center gap-3">
      <button
        type="button"
        :class="BUTTON.secondary"
        :aria-busy="check.isPending.value || undefined"
        @click="run"
      >
        <Activity aria-hidden="true" class="size-4" />{{ $t('admin.externalJudge.check.button') }}
      </button>
      <p class="min-w-0 flex-1 text-sm text-muted">{{ $t('admin.externalJudge.check.hint') }}</p>
    </div>
    <AdminStatus
      v-if="result"
      kind="done"
      :text="
        $t('admin.externalJudge.check.ok', {
          time: checkedAt,
          count: result.ojs.length,
          ojs: result.ojs.join(', '),
        })
      "
    />
    <AdminStatus
      v-else-if="check.failure.value"
      kind="refused"
      :text="
        $t('admin.externalJudge.check.failed', {
          time: checkedAt,
          reason: failureTextOf(check.failure.value),
        })
      "
    />
  </div>
</template>
