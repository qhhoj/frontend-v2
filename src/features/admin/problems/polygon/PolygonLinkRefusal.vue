<script setup lang="ts">
import { computed } from 'vue';
import Notice from '@/components/ui/Notice.vue';
import { translate } from '@/i18n';
import { usePermissions } from '@/stores/use-permissions';
import { failureTextOf, formatWait } from '../../ui/admin-errors';
import { buttonClass } from '../../ui/controls';
import type { LinkRefusal } from './polygon-problem-link';

/**
 * Why the pasted link cannot be imported, with what to change on Polygon; "Kiểm tra lại" where waiting can help. A refusal
 * of the text itself (`fromText`) is not announced as an alert, so typing a link by hand is not interrupted.
 */
const props = defineProps<{
  refusal: LinkRefusal;
  accountName: string;
  isChecking: boolean;
  fromText: boolean;
  /** Seconds until the step checks a `checking` refusal again by itself; null when it will not. */
  autoRecheckIn: number | null;
}>();
const emit = defineEmits<{ checkAgain: [] }>();
const CHECK_AGAIN = new Set(['noPackage', 'notReady', 'checking', 'other']);
const canCheckAgain = computed(() => CHECK_AGAIN.has(props.refusal.kind));
const { can } = usePermissions();
const shape = computed(() => translate('admin.polygonLink.howTo.shape'));

/** The title of a refusal: its kind's own, with the code or package it names. */
const title = computed(() => {
  const refusal = props.refusal;
  const key = 'admin.polygonLink.refusal';
  if (refusal.kind === 'notReady' && refusal.newest)
    return translate(`${key}.notReady.${refusal.newest.state}`, { ...refusal.newest });
  if (refusal.kind === 'linkedDeleted')
    return refusal.code
      ? translate(`${key}.linkedDeleted.title`, { code: refusal.code })
      : translate(`${key}.linkedDeleted.titleHidden`);
  if (refusal.kind === 'other') return undefined;
  return translate(`${key}.${refusal.kind}.title`, { account: props.accountName });
});
</script>

<template>
  <Notice
    compact
    :tone="refusal.kind === 'checking' ? 'info' : 'danger'"
    :role="fromText ? null : refusal.kind === 'checking' ? 'status' : 'alert'"
    :title="title"
    data-testid="polygon-link-refusal"
    :data-refusal="refusal.kind"
    class="[overflow-wrap:anywhere]"
  >
    <p v-if="refusal.kind === 'other'">{{ failureTextOf(refusal.error) }}</p>
    <p v-else-if="refusal.kind === 'linked'">
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
    <p v-else-if="refusal.kind === 'linkedDeleted'">
      {{
        refusal.code
          ? $t('admin.polygonLink.refusal.linkedDeleted.body', { code: refusal.code })
          : $t('admin.polygonLink.refusal.linkedDeleted.bodyHidden')
      }}
    </p>
    <div v-else-if="refusal.kind === 'notReady' && refusal.newest" class="flex flex-col gap-1">
      <p v-if="refusal.newest.comment" data-testid="polygon-package-comment">
        {{ $t('admin.polygonLink.refusal.notReady.comment') }}
        <q class="font-mono">{{ refusal.newest.comment }}</q>
      </p>
      <p v-if="refusal.newest.state === 'RUNNING'">
        {{ $t('admin.polygonLink.refusal.notReady.runningBody') }}
      </p>
      <p v-else-if="refusal.newest.comment">
        {{ $t('admin.polygonLink.refusal.notReady.failedBody') }}
      </p>
      <p v-else>{{ $t('admin.polygonLink.refusal.notReady.failedNoComment') }}</p>
    </div>
    <p v-else-if="refusal.kind === 'checking'">
      {{
        autoRecheckIn === null
          ? $t('admin.polygonLink.refusal.checking.manual')
          : $t('admin.polygonLink.refusal.checking.auto', { wait: formatWait(autoRecheckIn) })
      }}
    </p>
    <p v-else>
      {{ $t(`admin.polygonLink.refusal.${refusal.kind}.body`, { account: accountName, shape }) }}
    </p>
    <template #action>
      <div v-if="canCheckAgain || refusal.kind === 'linkedDeleted'" class="mt-2">
        <RouterLink
          v-if="refusal.kind === 'linkedDeleted' && refusal.code && can('judge.delete_problem')"
          :to="{ name: 'admin-problemsDeleted' }"
          :class="buttonClass('secondary', 'sm')"
          >{{ $t('admin.polygonLink.refusal.linkedDeleted.open') }}</RouterLink
        >
        <button
          v-else-if="canCheckAgain"
          type="button"
          :class="buttonClass('secondary', 'sm')"
          :aria-busy="isChecking || undefined"
          @click="emit('checkAgain')"
        >
          {{ $t('admin.polygonLink.link.checkAgain') }}
        </button>
      </div>
    </template>
  </Notice>
</template>
