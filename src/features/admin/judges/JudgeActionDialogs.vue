<script setup lang="ts">
import { computed, nextTick, watch } from 'vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import type { Judge } from '@/api/types/judges-admin';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import DisconnectDialog from './DisconnectDialog.vue';
import type { JudgeDialog } from './judge-actions';
import { useJudgeWrites } from './judges.mutations';
import { JUDGE_SEARCH_ID, useJudgesCache } from './judges.queries';

/**
 * The confirm dialogs of the judges board, one open at a time (`open`). They stay mounted, so PrimeVue can return focus to
 * the ⋯ button that opened them; `judge` is kept after a close so the title does not blank while the dialog fades.
 */
const props = defineProps<{ judge: Judge | null }>();
const open = defineModel<JudgeDialog | null>('open', { required: true });
const emit = defineEmits<{ rotated: [judgeName: string, authKey: string] }>();
const writes = useJudgeWrites();
const cache = useJudgesCache();
const name = computed(() => props.judge?.name ?? '');

const isOpen = (dialog: JudgeDialog) =>
  computed({
    get: () => open.value === dialog,
    set: (isVisible: boolean) => {
      if (!isVisible && open.value === dialog) open.value = null;
    },
  });
const isBlockOpen = isOpen('block');
const isRotateOpen = isOpen('rotate');
const isDisconnectOpen = isOpen('disconnect');
const isDeleteOpen = isOpen('delete');

/** A dialog opens on a clean slate: a refusal from an earlier attempt must not repeat inside it. */
watch(open, (dialog) => {
  if (dialog === 'block') writes.patch.reset();
  if (dialog === 'rotate') writes.rotate.reset();
  if (dialog === 'disconnect') writes.disconnect.reset();
  if (dialog === 'delete') writes.remove.reset();
});

async function block() {
  await writes.patch.run({ name: name.value, patch: { isBlocked: true } });
  if (writes.patch.isDone.value) open.value = null;
}
async function rotate() {
  const result = await writes.rotate.run(name.value);
  if (!result) return;
  open.value = null;
  emit('rotated', name.value, result.authKey);
}
async function disconnect(force: boolean) {
  await writes.disconnect.run({ name: name.value, force });
  if (writes.disconnect.isDone.value) open.value = null;
}
/** The dialog closes first, then the row leaves the list; focus goes to the search box. */
async function remove() {
  const judgeName = name.value;
  await writes.remove.run(judgeName);
  if (!writes.remove.isDone.value) return;
  open.value = null;
  await nextTick();
  cache.remove(judgeName);
}
const searchBox = () => document.getElementById(JUDGE_SEARCH_ID);
const disconnectFailure = computed(() =>
  writes.disconnect.failure.value ? failureTextOf(writes.disconnect.failure.value) : null,
);
</script>

<template>
  <ConfirmDialog
    v-model:visible="isBlockOpen"
    tone="danger"
    :title="$t('admin.judges.block.title', { name })"
    :body="$t('admin.judges.block.body')"
    :confirm-label="$t('admin.judges.block.confirm')"
    :busy="writes.patch.isPending.value"
    @confirm="block"
  >
    <template v-if="writes.patch.failure.value" #error>
      <AdminStatus kind="refused" :text="failureTextOf(writes.patch.failure.value)" />
    </template>
  </ConfirmDialog>
  <ConfirmDialog
    v-model:visible="isRotateOpen"
    :title="$t('admin.judges.rotate.title', { name })"
    :body="$t('admin.judges.rotate.body')"
    :confirm-label="$t('admin.judges.rotate.confirm')"
    :busy="writes.rotate.isPending.value"
    @confirm="rotate"
  >
    <template v-if="writes.rotate.failure.value" #error>
      <AdminStatus kind="refused" :text="failureTextOf(writes.rotate.failure.value)" />
    </template>
  </ConfirmDialog>
  <DisconnectDialog
    v-model:visible="isDisconnectOpen"
    :judge-name="name"
    :is-busy="writes.disconnect.isPending.value"
    :failure-text="disconnectFailure"
    @confirm="disconnect"
  />
  <ConfirmDialog
    v-model:visible="isDeleteOpen"
    tone="danger"
    :title="$t('admin.judges.delete.title', { name })"
    :body="$t('admin.judges.delete.body')"
    :confirm-label="$t('admin.judges.delete.confirm')"
    :busy="writes.remove.isPending.value"
    :return-focus-to="searchBox"
    @confirm="remove"
  >
    <template v-if="writes.remove.failure.value" #error>
      <AdminStatus kind="refused" :text="failureTextOf(writes.remove.failure.value)" />
    </template>
  </ConfirmDialog>
</template>
