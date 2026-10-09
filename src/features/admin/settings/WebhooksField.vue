<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AdminBit from '../shell/AdminBit.vue';
import AdminField from '../ui/AdminField.vue';
import { ADMIN_BUTTON_CLASS, ADMIN_INPUT_CLASS } from '../ui/classes';
import { WEBHOOK_EVENTS } from './setting-blocks';
import type { WebhookRow, WebhooksDraft } from './setting-values';

/** The whole list is one secret: it is only written, never read back, and saving replaces it. */
const draft = defineModel<WebhooksDraft>({ required: true });
const { t } = useI18n();

const startReplacing = () =>
  (draft.value = { ...draft.value, isReplacing: true, rows: [{ event: 'default', url: '' }] });
const cancelReplacing = () => (draft.value = { ...draft.value, isReplacing: false, rows: [] });
const setRows = (rows: WebhookRow[]) => (draft.value = { ...draft.value, rows });
const addRow = () => setRows([...draft.value.rows, { event: 'default', url: '' }]);
const removeRow = (index: number) =>
  setRows(draft.value.rows.filter((row, position) => row !== undefined && position !== index));
const patchRow = (index: number, patch: Partial<WebhookRow>) =>
  setRows(
    draft.value.rows.map((row, position) => (position === index ? { ...row, ...patch } : row)),
  );
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-sm font-semibold">{{ t('admin.settings.webhooks.title') }}</span>
      <span
        class="rounded-pill px-2 text-xs"
        :class="
          draft.isSet ? 'bg-accent-soft text-accent-soft-text' : 'border border-line text-muted'
        "
      >
        {{ draft.isSet ? t('admin.settings.chip.set') : t('admin.settings.chip.unset') }}
      </span>
      <AdminBit placement="security" />
      <button
        v-if="!draft.isReplacing"
        type="button"
        :class="ADMIN_BUTTON_CLASS"
        @click="startReplacing"
      >
        {{ t('admin.settings.webhooks.replace') }}
      </button>
      <button v-else type="button" :class="ADMIN_BUTTON_CLASS" @click="cancelReplacing">
        {{ t('admin.settings.secret.cancelReplace') }}
      </button>
      <slot name="actions" />
    </div>
    <template v-if="draft.isReplacing">
      <p class="text-xs text-muted">
        {{ t('admin.settings.webhooks.note') }} {{ t('admin.settings.secret.emptyKeeps') }}
      </p>
      <div
        v-for="(row, index) in draft.rows"
        :key="index"
        class="grid gap-2 sm:grid-cols-[12rem_minmax(0,1fr)_auto]"
      >
        <AdminField v-slot="{ id }" :label="t('admin.settings.webhooks.event')">
          <select
            :id="id"
            :value="row.event"
            :class="ADMIN_INPUT_CLASS"
            @change="patchRow(index, { event: ($event.target as HTMLSelectElement).value })"
          >
            <option v-for="event in WEBHOOK_EVENTS" :key="event" :value="event">{{ event }}</option>
          </select>
        </AdminField>
        <AdminField v-slot="{ id, describedBy }" :label="t('admin.settings.webhooks.url')">
          <input
            :id="id"
            :value="row.url"
            type="url"
            :aria-describedby="describedBy"
            :class="ADMIN_INPUT_CLASS"
            @input="patchRow(index, { url: ($event.target as HTMLInputElement).value })"
          />
        </AdminField>
        <button
          type="button"
          class="self-end"
          :class="ADMIN_BUTTON_CLASS"
          @click="removeRow(index)"
        >
          {{ t('admin.settings.webhooks.removeRow') }}
        </button>
      </div>
      <button type="button" class="self-start" :class="ADMIN_BUTTON_CLASS" @click="addRow">
        {{ t('admin.settings.webhooks.addRow') }}
      </button>
    </template>
  </div>
</template>
