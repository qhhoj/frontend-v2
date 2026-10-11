<script setup lang="ts">
import { computed } from 'vue';
import AdminBit from '../../shell/AdminBit.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { ADMIN_BUTTON_CLASS } from '../../ui/classes';
import type { LinkRefusal } from './polygon-problem-link';

/** Why the pasted link cannot be imported, with what to change on Polygon; "Kiểm tra lại" where waiting can help. */
const props = defineProps<{ refusal: LinkRefusal; accountName: string; isChecking: boolean }>();
const emit = defineEmits<{ checkAgain: [] }>();
const canCheckAgain = computed(() => ['noPackage', 'notFull'].includes(props.refusal.kind));
</script>

<template>
  <AdminStatus v-if="refusal.kind === 'other'" kind="refused" :text="failureTextOf(refusal.error)">
    <button
      type="button"
      :class="ADMIN_BUTTON_CLASS"
      :aria-busy="isChecking || undefined"
      @click="emit('checkAgain')"
    >
      {{ $t('admin.polygonLink.link.checkAgain') }}
    </button>
  </AdminStatus>
  <div
    v-else
    role="alert"
    data-testid="polygon-link-refusal"
    :data-refusal="refusal.kind"
    class="flex items-start gap-3 rounded-row border border-line bg-surface-strong p-4"
  >
    <AdminBit placement="refused" />
    <div class="flex min-w-0 flex-col gap-1">
      <h3 class="font-semibold">
        {{
          $t(`admin.polygonLink.refusal.${refusal.kind}.title`, {
            account: accountName,
          })
        }}
      </h3>
      <p v-if="refusal.kind === 'linked'" class="text-sm text-muted">
        <template v-if="refusal.code">
          {{ $t('admin.polygonLink.refusal.linked.withCode', { code: refusal.code }) }}
          <RouterLink
            :to="{ name: 'admin-problemGeneral', params: { code: refusal.code } }"
            class="font-semibold text-accent-text underline"
            >{{ $t('admin.polygonLink.refusal.linked.open', { code: refusal.code }) }}</RouterLink
          >
        </template>
        <template v-else>{{ $t('admin.polygonLink.refusal.linked.hidden') }}</template>
      </p>
      <p v-else class="text-sm text-muted">
        {{ $t(`admin.polygonLink.refusal.${refusal.kind}.body`, { account: accountName }) }}
      </p>
      <div v-if="canCheckAgain" class="mt-2">
        <button
          type="button"
          :class="ADMIN_BUTTON_CLASS"
          :aria-busy="isChecking || undefined"
          @click="emit('checkAgain')"
        >
          {{ $t('admin.polygonLink.link.checkAgain') }}
        </button>
      </div>
    </div>
  </div>
</template>
