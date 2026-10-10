<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue';
import { updateOrganizationQuota } from '@/api/organization-usage.api';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { formatNumber } from '@/lib/format';
import { formatMebibytes } from '@/lib/quota';
import { useLocaleStore } from '@/stores/locale.store';
import AdminField from '../../ui/AdminField.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { ADMIN_INPUT_CLASS } from '../../ui/classes';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import {
  USAGE_DETAIL_KEY,
  USAGE_OVERVIEW_KEY,
  useUsageDetailQuery,
} from './quota-overview.queries';
import { quotaBodyOf, quotaFormErrors, quotaFormOf } from './quota-form';
import type { QuotaForm } from './quota-form';

/** Edits one organization's overrides; reads its usage for the current values, sends only what changed. */
const props = defineProps<{ slug: string | null; name: string }>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ saved: [] }>();
const locale = useLocaleStore();
const detail = useUsageDetailQuery(toRef(props, 'slug'));
const original = computed<QuotaForm>(() =>
  quotaFormOf(
    detail.data.value?.quota ?? { monthlyCredits: null, storageBytes: null },
    detail.data.value?.unlimited ?? false,
  ),
);
const form = ref<QuotaForm>({ credits: '', storageMib: '', unlimited: false });
const errors = ref<{ credits?: string; storageMib?: string }>({});
const isLoaded = computed(() => detail.data.value !== undefined);
/**
 * The form starts from the stored values when the dialog opens, for another organization, or when the first data of one arrives.
 * A refetch of the same data (window focus brings new live counters) must not wipe what staff typed.
 */
watch([visible, () => props.slug, isLoaded], ([isOpen]) => {
  if (isOpen) form.value = { ...original.value };
  errors.value = {};
});
const save = useAdminMutation({
  mutate: (body: ReturnType<typeof quotaBodyOf>) => updateOrganizationQuota(props.slug ?? '', body),
  invalidates: () => [USAGE_OVERVIEW_KEY, USAGE_DETAIL_KEY],
  onDone: () => {
    // `saved` first: the page still knows which organization was edited until the dialog closes.
    emit('saved');
    visible.value = false;
  },
});
const current = computed(() => {
  const usage = detail.data.value;
  if (!usage) return { credits: '', storage: '' };
  return {
    credits: formatNumber(usage.credits.limit, locale.locale),
    storage: formatMebibytes(usage.storage.limit, locale.locale),
  };
});
function submit() {
  errors.value = quotaFormErrors(form.value);
  if (Object.keys(errors.value).length > 0) return;
  const body = quotaBodyOf(form.value, original.value);
  if (Object.keys(body).length === 0) {
    visible.value = false;
    return;
  }
  void save.run(body);
}
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t('admin.quota.editTitle', { name })"
    :confirm-label="$t('admin.quota.save')"
    :busy="save.isPending.value"
    :can-confirm="isLoaded"
    @confirm="submit"
  >
    <AdminField
      v-slot="{ id, describedBy }"
      input-id="quota-credits"
      :label="$t('admin.quota.credits')"
      :hint="$t('admin.quota.defaultHint', { current: current.credits })"
      :error="errors.credits ? $t(errors.credits) : undefined"
    >
      <input
        :id="id"
        v-model="form.credits"
        :disabled="!isLoaded"
        inputmode="numeric"
        :class="ADMIN_INPUT_CLASS"
        :aria-describedby="describedBy"
      />
    </AdminField>
    <AdminField
      v-slot="{ id, describedBy }"
      input-id="quota-storage"
      :label="$t('admin.quota.storage')"
      :hint="$t('admin.quota.defaultHint', { current: current.storage })"
      :error="errors.storageMib ? $t(errors.storageMib) : undefined"
    >
      <input
        :id="id"
        v-model="form.storageMib"
        :disabled="!isLoaded"
        inputmode="numeric"
        :class="ADMIN_INPUT_CLASS"
        :aria-describedby="describedBy"
      />
    </AdminField>
    <label class="flex items-start gap-2 text-sm">
      <input
        v-model="form.unlimited"
        type="checkbox"
        data-testid="quota-unlimited"
        :disabled="!isLoaded"
        class="mt-1"
      />
      <span>
        <span class="font-semibold">{{ $t('admin.quota.unlimitedToggle') }}</span>
        <span class="block text-muted">{{ $t('admin.quota.unlimitedHint') }}</span>
      </span>
    </label>
    <template #error>
      <AdminStatus
        v-if="save.failure.value"
        kind="refused"
        :text="failureTextOf(save.failure.value)"
      />
    </template>
  </ConfirmDialog>
</template>
