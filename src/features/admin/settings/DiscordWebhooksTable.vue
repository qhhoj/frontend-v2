<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import {
  fetchDiscordWebhooks,
  removeDiscordWebhook,
  setDiscordWebhook,
  testDiscordWebhook,
} from '@/api/settings-admin.api';
import type { DiscordEvent, DiscordWebhook, DiscordWebhookSlot } from '@/api/types/settings-admin';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useViewerId } from '@/stores/use-viewer-id';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { BUTTON, INPUT } from '../ui/controls';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { settingRevisionsPrefix, settingsKey } from './settings.queries';

/** One row per slot: its masked target, and Set, Remove and Test, each its own write (the URLs are never read back). */
const KEY = ['admin', 'discord-webhooks'] as const;
const viewer = useViewerId();
const queryClient = useQueryClient();
const query = useQuery({
  queryKey: computed(() => [...KEY, viewer.value]),
  queryFn: fetchDiscordWebhooks,
});
const rows = computed(() => query.data.value ?? []);
const editing = ref<DiscordWebhookSlot | null>(null);
const url = ref('');
const removing = ref<DiscordWebhookSlot | null>(null);
const isRemoveOpen = ref(false);
const urlError = ref<string | null>(null);
const { t } = useI18n();
const notice = ref<{ kind: 'done' | 'queued'; key: string; event: string } | null>(null);

const answer = (saved: DiscordWebhook[]) => queryClient.setQueryData([...KEY, viewer.value], saved);
const touched = () => [[...settingsKey], settingRevisionsPrefix('discord.webhooks')] as const;
const writer = useAdminMutation({
  mutate: ({ event, next }: { event: DiscordWebhookSlot; next: string | null }) =>
    next === null ? removeDiscordWebhook(event) : setDiscordWebhook(event, next),
  invalidates: () => [...touched()],
  onSuccess: answer,
});
const tester = useAdminMutation({ mutate: (event: DiscordEvent) => testDiscordWebhook(event) });

function startEdit(event: DiscordWebhookSlot) {
  editing.value = event;
  url.value = '';
  urlError.value = null;
  writer.reset();
}
async function saveUrl() {
  if (!editing.value || !url.value.trim()) return;
  urlError.value = url.value.trim().startsWith('https://')
    ? null
    : t('admin.settings.webhooks.httpsOnly');
  if (urlError.value) return;
  const event = editing.value;
  await writer.run({ event, next: url.value.trim() });
  if (!writer.isDone.value) return;
  editing.value = null;
  notice.value = { kind: 'done', key: 'admin.settings.webhooks.saved', event };
}
function askRemove(event: DiscordWebhookSlot) {
  removing.value = event;
  isRemoveOpen.value = true;
}
async function confirmRemove() {
  const event = removing.value;
  if (!event) return;
  await writer.run({ event, next: null });
  isRemoveOpen.value = false;
  if (writer.isDone.value)
    notice.value = { kind: 'done', key: 'admin.settings.webhooks.removed', event };
}
async function sendTest(event: DiscordEvent) {
  notice.value = null;
  await tester.run(event);
  if (tester.isDone.value)
    notice.value = { kind: 'queued', key: 'admin.settings.webhooks.testQueued', event };
}
/** `default` has no test of its own: every event without a URL tests it. */
const canTest = (row: DiscordWebhook): row is DiscordWebhook & { event: DiscordEvent } =>
  row.event !== 'default' && (row.target !== null || row.usesDefault);
const failure = computed(() => writer.failure.value ?? tester.failure.value);
</script>

<template>
  <div class="flex flex-col gap-3">
    <AdminStatus
      v-if="notice"
      :kind="notice.kind"
      :text="$t(notice.key, { event: $t(`admin.settings.webhooks.events.${notice.event}`) })"
    />
    <AdminStatus v-if="failure && !editing" kind="refused" :text="failureTextOf(failure)" />
    <QueryState
      :loading="query.isPending.value"
      :error="query.error.value"
      @retry="query.refetch()"
    >
      <template #skeleton><SkeletonBlock class="h-40 w-full" /></template>
      <ul class="divide-y divide-line rounded-row border border-line">
        <li v-for="row in rows" :key="row.event" class="flex flex-col gap-2 p-3">
          <div class="grid items-center gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div class="min-w-0">
              <p class="font-semibold">{{ $t(`admin.settings.webhooks.events.${row.event}`) }}</p>
              <p class="font-mono text-xs text-muted">{{ row.event }}</p>
              <p class="mt-1 text-sm break-all" data-testid="webhook-target">
                <span v-if="row.target" class="font-mono">{{ row.target }}</span>
                <span v-else-if="row.usesDefault" class="text-muted">{{
                  $t('admin.settings.webhooks.usesDefault')
                }}</span>
                <span v-else class="text-muted">{{ $t('admin.settings.webhooks.off') }}</span>
              </p>
            </div>
            <div class="flex flex-wrap gap-2 sm:justify-end">
              <button type="button" :class="BUTTON.secondary" @click="startEdit(row.event)">
                {{
                  row.target
                    ? $t('admin.settings.webhooks.replace')
                    : $t('admin.settings.webhooks.set')
                }}
              </button>
              <button
                v-if="row.target"
                type="button"
                :class="BUTTON.secondary"
                @click="askRemove(row.event)"
              >
                {{ $t('admin.settings.webhooks.remove') }}
              </button>
              <button
                v-if="canTest(row)"
                type="button"
                :class="BUTTON.secondary"
                :aria-disabled="tester.isPending.value || undefined"
                @click="tester.isPending.value || sendTest(row.event)"
              >
                {{ $t('admin.settings.webhooks.test') }}
              </button>
            </div>
          </div>
          <form
            v-if="editing === row.event"
            class="flex flex-wrap items-end gap-2"
            @submit.prevent="saveUrl"
          >
            <label
              class="flex min-w-[min(100%,20rem)] flex-1 flex-col gap-1.5 text-sm font-semibold"
            >
              {{ $t('admin.settings.webhooks.url') }}
              <input
                v-model="url"
                type="url"
                required
                autocomplete="off"
                placeholder="https://discord.com/api/webhooks/…"
                :class="[INPUT, 'font-normal']"
                :aria-invalid="urlError || writer.fieldErrors.value.url ? 'true' : undefined"
              />
            </label>
            <button
              type="submit"
              :class="BUTTON.primary"
              :aria-disabled="writer.isPending.value || undefined"
            >
              {{ $t('common.save') }}
            </button>
            <button type="button" :class="BUTTON.secondary" @click="editing = null">
              {{ $t('admin.settings.secret.cancelReplace') }}
            </button>
            <p
              v-if="urlError || writer.failure.value"
              role="alert"
              class="w-full text-sm text-negative"
            >
              {{ urlError ?? writer.fieldErrors.value.url ?? failureTextOf(writer.failure.value) }}
            </p>
          </form>
        </li>
      </ul>
    </QueryState>
    <ConfirmDialog
      v-model:visible="isRemoveOpen"
      tone="danger"
      :title="
        $t('admin.settings.webhooks.removeTitle', {
          event: removing ? $t(`admin.settings.webhooks.events.${removing}`) : '',
        })
      "
      :body="$t('admin.settings.webhooks.removeBody')"
      :confirm-label="$t('admin.settings.webhooks.remove')"
      :busy="writer.isPending.value"
      @confirm="confirmRemove"
    />
  </div>
</template>
