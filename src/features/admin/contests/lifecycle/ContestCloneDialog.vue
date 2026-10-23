<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { cloneContest } from '@/api/contest-editing.api';
import type { EditableContest } from '@/api/types/contest-editing';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { translate } from '@/i18n';
import AdminField from '../../ui/AdminField.vue';
import { failureTextOf, fieldErrorsOf } from '../../ui/admin-errors';
import { INPUT } from '../../ui/controls';
import { provideDateValidity } from '../../ui/form/date-validity';
import AdminDateTimeField from '../../ui/form/AdminDateTimeField.vue';
import { formatInZone } from '../../ui/form/site-time';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { CONTEST_INDEX_KEY, PUBLIC_CONTESTS_KEY } from '../contest-editing.queries';
import { cloneEnd, defaultCloneStart } from './contest-clone';

/**
 * "Nhân bản kỳ thi…" from the row menu, the editor header and the Actions tab: a new key and a start (the source's one
 * week later), with the end that follows. The copy keeps problems and settings, has no participants, and opens at once.
 */
const props = defineProps<{ source: { key: string; startTime: string; endTime: string } }>();
const visible = defineModel<boolean>('visible', { required: true });
const router = useRouter();
const newKey = ref('');
const startTime = ref<string | null>(null);
const localKeyError = ref('');
const startError = ref('');
const { hasUnreadableDate } = provideDateValidity();
const KEY = 'admin.contests.actions.clone';

const mutation = useAdminMutation({
  mutate: () => cloneContest(props.source.key, newKey.value.trim(), startTime.value!),
  invalidates: () => [PUBLIC_CONTESTS_KEY, CONTEST_INDEX_KEY],
  successText: (copy: EditableContest) => translate(`${KEY}.done`, { key: copy.key }),
  onDone: (copy: EditableContest) => {
    visible.value = false;
    void router.push({ name: 'admin-contestGeneral', params: { key: copy.key } });
  },
});
const keyError = computed(
  () => localKeyError.value || fieldErrorsOf(mutation.failure.value).key || '',
);
const pageFailure = computed(() =>
  mutation.failure.value && !fieldErrorsOf(mutation.failure.value).key
    ? failureTextOf(mutation.failure.value)
    : '',
);
const endText = computed(() => formatInZone(cloneEnd(props.source, startTime.value)));

watch(
  visible,
  (isOpen) => {
    if (!isOpen) return;
    newKey.value = '';
    startTime.value = defaultCloneStart(props.source.startTime);
    localKeyError.value = '';
    startError.value = '';
    mutation.reset();
  },
  { immediate: true },
);
/** A typed key retires the last answer and its message: the box describes what is typed now. */
watch(newKey, () => {
  localKeyError.value = '';
  mutation.reset();
});

/**
 * An empty key or start is said here (a cleared start would silently keep the source's times); any other key goes to the
 * backend, which judges the taken or malformed ones.
 */
function confirm() {
  const required = translate('admin.contests.general.errors.required');
  localKeyError.value = newKey.value.trim() ? '' : required;
  startError.value = startTime.value ? '' : required;
  if (hasUnreadableDate.value) startError.value = translate('admin.form.dateTime.invalid');
  if (!localKeyError.value && !startError.value) void mutation.run(undefined);
}
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t(`${KEY}.confirmTitle`)"
    :confirm-label="$t(`${KEY}.confirm`)"
    :busy="mutation.isPending.value"
    @confirm="confirm"
  >
    <p class="text-muted">{{ $t(`${KEY}.description`) }}</p>
    <AdminField input-id="clone-key" :label="$t(`${KEY}.keyLabel`)" :error="keyError">
      <template #default="{ id, describedBy, invalid }">
        <input
          :id="id"
          v-model="newKey"
          :class="[INPUT, 'font-mono']"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
          autocomplete="off"
          spellcheck="false"
        />
      </template>
    </AdminField>
    <AdminDateTimeField
      v-model="startTime"
      input-id="clone-startTime"
      :label="$t(`${KEY}.startLabel`)"
      :error="startError || fieldErrorsOf(mutation.failure.value).startTime"
      required
      :hint="endText ? $t(`${KEY}.endLine`, { time: endText }) : undefined"
    />
    <template #error>
      <p v-if="pageFailure" role="alert" class="text-sm text-negative">{{ pageFailure }}</p>
    </template>
  </ConfirmDialog>
</template>
