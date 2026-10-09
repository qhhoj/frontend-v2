<script setup lang="ts">
import { computed, ref } from 'vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import type { Judge, JudgePatch } from '@/api/types/judges-admin';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import DisconnectDialog from './DisconnectDialog.vue';
import JudgeActions from './JudgeActions.vue';
import JudgeDetails from './JudgeDetails.vue';
import { judgeStatus, pingMs } from './judge-stats';
import { useJudgeWrites } from './judges.mutations';

const props = defineProps<{ judge: Judge }>();
const emit = defineEmits<{ rotated: [judgeName: string, authKey: string] }>();
const locale = useLocaleStore();
const writes = useJudgeWrites();
const isDetailsOpen = ref(false);
const isBlockDialogOpen = ref(false);
const isRotateDialogOpen = ref(false);
const isDisconnectDialogOpen = ref(false);
const status = computed(() => judgeStatus(props.judge));
const pingMsValue = computed(() => pingMs(props.judge.ping));
const loadText = computed(() =>
  props.judge.load === null ? null : formatNumber(props.judge.load, locale.locale, 2),
);
const detailsId = computed(() => `judge-details-${props.judge.name}`);

function patchJudge(changes: JudgePatch) {
  return writes.patch.run({ name: props.judge.name, patch: changes });
}
/** A dialog opens on a clean slate: a refusal from an earlier action must not repeat inside it. */
function openBlockDialog() {
  writes.patch.reset();
  isBlockDialogOpen.value = true;
}
async function setBlocked(isBlocked: boolean) {
  await patchJudge({ isBlocked });
  if (writes.patch.isDone.value) isBlockDialogOpen.value = false;
}
async function rotateKey() {
  const result = await writes.rotate.run(props.judge.name);
  if (!result) return;
  isRotateDialogOpen.value = false;
  emit('rotated', props.judge.name, result.authKey);
}
async function disconnect(force: boolean) {
  await writes.disconnect.run({ name: props.judge.name, force });
  if (writes.disconnect.isDone.value) isDisconnectDialogOpen.value = false;
}
</script>

<template>
  <article data-testid="judge-row" class="glass flex flex-col gap-4 rounded-panel p-5">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h2 class="font-mono text-base font-semibold break-all">{{ judge.name }}</h2>
        <p class="text-sm text-muted">{{ judge.description }}</p>
      </div>
      <p class="text-sm font-semibold">{{ $t(`admin.judges.status.${status}`) }}</p>
    </header>
    <p class="flex flex-wrap gap-x-5 gap-y-1 text-sm">
      <span
        >{{ $t('admin.judges.row.loadLabel') }}
        {{ loadText ?? $t('admin.judges.stats.noLoad') }}</span
      >
      <span>
        {{
          pingMsValue === null
            ? $t('admin.judges.stats.noLoad')
            : $t('admin.judges.row.ping', { ms: pingMsValue })
        }}
      </span>
      <span>{{ $t('admin.judges.row.slots', { busy: judge.busy, slots: judge.slots }) }}</span>
      <span v-if="judge.build" class="font-mono">{{
        $t('admin.judges.row.build', { build: judge.build })
      }}</span>
      <span>{{ $t('admin.judges.row.languages', { count: judge.runtimes.length }) }}</span>
      <span v-if="judge.lastIp" class="font-mono">{{ judge.lastIp }}</span>
    </p>
    <JudgeActions
      :judge="judge"
      :is-busy="writes.patch.isPending.value"
      @toggle-disabled="patchJudge({ isDisabled: !judge.isDisabled })"
      @unblock="setBlocked(false)"
      @ask-block="openBlockDialog"
      @ask-rotate="isRotateDialogOpen = true"
      @ask-disconnect="isDisconnectDialogOpen = true"
    />
    <AdminStatus
      v-if="writes.patch.failure.value"
      kind="refused"
      :text="failureTextOf(writes.patch.failure.value)"
    />
    <button
      type="button"
      class="self-start text-sm font-semibold text-accent-text underline"
      :aria-controls="detailsId"
      :aria-expanded="isDetailsOpen"
      @click="isDetailsOpen = !isDetailsOpen"
    >
      {{ $t('admin.judges.row.details') }}
    </button>
    <JudgeDetails
      v-if="isDetailsOpen"
      :id="detailsId"
      :judge="judge"
      :is-saving="writes.patch.isPending.value"
      @save-description="(description) => patchJudge({ description })"
    />

    <!-- Kept mounted: PrimeVue returns focus to the opener in its leave hook, which a v-if unmount would skip. -->
    <ConfirmDialog
      v-model:visible="isBlockDialogOpen"
      tone="danger"
      :title="$t('admin.judges.block.title', { name: judge.name })"
      :body="$t('admin.judges.block.body')"
      :confirm-label="$t('admin.judges.block.confirm')"
      :busy="writes.patch.isPending.value"
      @confirm="setBlocked(true)"
    >
      <template v-if="writes.patch.failure.value" #error>
        <AdminStatus kind="refused" :text="failureTextOf(writes.patch.failure.value)" />
      </template>
    </ConfirmDialog>
    <ConfirmDialog
      v-model:visible="isRotateDialogOpen"
      tone="danger"
      :title="$t('admin.judges.rotate.title', { name: judge.name })"
      :body="$t('admin.judges.rotate.body')"
      :confirm-label="$t('admin.judges.rotate.confirm')"
      :busy="writes.rotate.isPending.value"
      @confirm="rotateKey"
    >
      <template v-if="writes.rotate.failure.value" #error>
        <AdminStatus kind="refused" :text="failureTextOf(writes.rotate.failure.value)" />
      </template>
    </ConfirmDialog>
    <DisconnectDialog
      v-model:visible="isDisconnectDialogOpen"
      :judge-name="judge.name"
      :is-busy="writes.disconnect.isPending.value"
      :failure-text="
        writes.disconnect.failure.value ? failureTextOf(writes.disconnect.failure.value) : null
      "
      @confirm="disconnect"
    />
  </article>
</template>
