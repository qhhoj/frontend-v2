<script setup lang="ts">
import { computed } from 'vue';
import { contestFeedStreamUrl, contestFeedUrl } from '@/api/contest-ops.api';
import type { MintedFeedKey } from '@/api/types/contest-ops';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import CopyButton from '@/components/CopyButton.vue';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import AdminBit from '../../shell/AdminBit.vue';
import { absoluteUrl } from './feed-key';

/** The only time the key is shown: copy it now; closing the dialog forgets it. */
const props = defineProps<{ minted: MintedFeedKey; contestKey: string }>();
const visible = defineModel<boolean>('visible', { required: true });
const locale = useLocaleStore();
const origin = window.location.origin;
const rows = computed(() => [
  { id: 'username', value: props.minted.username },
  { id: 'key', value: props.minted.key },
  { id: 'snapshot', value: absoluteUrl(contestFeedUrl(props.contestKey), origin) },
  { id: 'stream', value: absoluteUrl(contestFeedStreamUrl(props.contestKey), origin) },
]);
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t('admin.contestData.feed.reveal.title')"
    :confirm-label="$t('admin.contestData.feed.reveal.done')"
    :cancel-label="$t('admin.contestData.feed.reveal.close')"
    @confirm="visible = false"
  >
    <p class="flex items-center gap-2.5 font-semibold">
      <AdminBit placement="security" />{{ $t('admin.contestData.feed.reveal.once') }}
    </p>
    <dl class="flex flex-col gap-3">
      <div v-for="row in rows" :key="row.id" class="flex flex-col gap-1">
        <dt class="text-sm text-muted">{{ $t(`admin.contestData.feed.reveal.rows.${row.id}`) }}</dt>
        <dd class="flex min-w-0 items-center gap-2">
          <code
            :data-testid="`reveal-${row.id}`"
            class="min-w-0 flex-1 rounded-cell bg-surface-strong px-3 py-2 font-mono text-sm break-all"
            >{{ row.value }}</code
          >
          <CopyButton
            :text="row.value"
            :label="$t(`admin.contestData.feed.reveal.copy.${row.id}`)"
          />
        </dd>
      </div>
    </dl>
    <p class="text-sm text-muted">
      {{
        $t('admin.contestData.feed.reveal.meta', {
          mode: $t(`admin.contestData.feed.modes.${minted.mode}`),
          expiresAt: formatDate(minted.expiresAt, 'datetime', locale.locale),
        })
      }}
    </p>
  </ConfirmDialog>
</template>
