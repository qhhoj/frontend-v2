<script setup lang="ts">
import { computed, ref } from 'vue';
import { Activity } from 'lucide-vue-next';
import { testPolygonConnection } from '@/api/polygon.api';
import type { PolygonTestResult } from '@/api/types/polygon';
import type { Setting } from '@/api/types/settings-admin';
import { formatClock } from '@/lib/format-date';
import PolygonSetterHowTo from '../problems/polygon/PolygonSetterHowTo.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { BUTTON } from '../ui/controls';
import { useAdminMutation } from '../ui/use-admin-mutation';

/** Under the Polygon block: one `problems.list` call with the saved key, and the setter how-to with the account name. */
const props = defineProps<{ settings: Setting[] }>();
const accountName = computed(() => {
  const value = props.settings.find((entry) => entry.key === 'polygon.accountName')?.value;
  return typeof value === 'string' ? value : '';
});
const checkedAt = ref('');
const result = ref<PolygonTestResult | null>(null);
const check = useAdminMutation({
  mutate: () => {
    result.value = null;
    return testPolygonConnection();
  },
  onSuccess: (answer) => (result.value = answer),
});

function run() {
  checkedAt.value = formatClock(new Date().toISOString());
  void check.run(undefined);
}
</script>

<template>
  <div class="flex flex-col gap-4 border-t border-line pt-4">
    <div class="flex flex-wrap items-center gap-3">
      <button
        type="button"
        :class="BUTTON.secondary"
        :aria-busy="check.isPending.value || undefined"
        @click="run"
      >
        <Activity aria-hidden="true" class="size-4" />{{ $t('admin.polygonLink.check.button') }}
      </button>
      <p class="min-w-0 flex-1 text-sm text-muted">{{ $t('admin.polygonLink.check.hint') }}</p>
    </div>
    <AdminStatus
      v-if="result"
      kind="done"
      :text="
        $t('admin.polygonLink.check.ok', {
          time: checkedAt,
          account: accountName,
          count: result.problemCount,
        })
      "
    />
    <AdminStatus
      v-else-if="check.failure.value"
      kind="refused"
      :text="
        $t('admin.polygonLink.check.failed', {
          time: checkedAt,
          reason: failureTextOf(check.failure.value),
        })
      "
    />
    <PolygonSetterHowTo :account-name="accountName" />
  </div>
</template>
