<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AuditEntry } from '@/api/types/audit-admin';
import { formatNumericDateTimeSeconds } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { shortId } from '../ui/short-id';
import AdminChip from '../ui/AdminChip.vue';
import { useAuditLinkOf } from './use-audit-link';

/** One change: when, who, what was done to which object, and the fields it touched (names only). */
const props = defineProps<{ entry: AuditEntry }>();
const i18n = useI18n();
const locale = useLocaleStore();

/** A kind or action the client has no words for still shows, as the backend's code. */
const labelOr = (key: string, code: string) => (i18n.te(key) ? i18n.t(key) : code);
const typeLabel = computed(() =>
  labelOr(`admin.audit.types.${props.entry.type}`, props.entry.type),
);
const actionLabel = computed(() =>
  labelOr(`admin.audit.actions.${props.entry.action}`, props.entry.action),
);
const linkOf = useAuditLinkOf();
const link = computed(() => linkOf(props.entry));
const objectName = computed(() => props.entry.object.label ?? shortId(props.entry.object.id));
</script>

<template>
  <li
    data-testid="audit-entry"
    class="grid gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[11rem_minmax(0,12rem)_minmax(0,1fr)]"
  >
    <time :datetime="entry.at" class="text-sm text-muted tabular-nums">
      {{ formatNumericDateTimeSeconds(entry.at, locale.locale) }}
    </time>
    <span class="min-w-0 text-sm">
      <AdminUserLabel v-if="entry.actor?.username" :username="entry.actor.username" :link="false" />
      <span v-else-if="entry.actor" class="font-mono text-muted">{{
        shortId(entry.actor.id)
      }}</span>
      <span v-else class="text-muted">{{ $t('admin.audit.system') }}</span>
    </span>
    <div class="flex min-w-0 flex-col gap-1">
      <p class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <AdminChip>{{ actionLabel }}</AdminChip>
        <span class="text-muted">{{ typeLabel }}</span>
        <RouterLink
          v-if="link"
          :to="link"
          class="min-w-0 truncate font-mono font-semibold text-accent hover:underline"
          >{{ objectName }}</RouterLink
        >
        <span
          v-else
          class="min-w-0 truncate font-mono"
          :class="{ 'line-through': entry.object.deleted }"
          >{{ objectName }}</span
        >
        <span v-if="entry.object.deleted" class="text-xs text-muted">{{
          $t('admin.audit.deleted')
        }}</span>
      </p>
      <p v-if="entry.changedFields.length > 0" class="text-xs break-words text-muted">
        {{ $t('admin.audit.fields') }}
        <span class="font-mono">{{ entry.changedFields.join(', ') }}</span>
      </p>
      <p v-if="entry.comment" class="text-xs text-muted">{{ entry.comment }}</p>
    </div>
  </li>
</template>
