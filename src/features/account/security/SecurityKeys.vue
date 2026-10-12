<script setup lang="ts">
import { KeyRound } from 'lucide-vue-next';
import { ref } from 'vue';
import type { SecurityKey } from '@/api/types/account';
import EmptyState from '@/components/EmptyState.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AppButton from '@/components/ui/AppButton.vue';
import RemoveSecurityKeyDialog from './RemoveSecurityKeyDialog.vue';
import { canRegisterSecurityKey } from './security-key';
import { useSecurityKeysQuery } from './security.queries';

/** The WebAuthn row of "Xác thực hai bước" and its keys (board SetSecurityA). Adding opens a card below (the section owns it). */
defineProps<{ busy: boolean }>();
const emit = defineEmits<{ add: []; removed: [key: SecurityKey] }>();
const keys = useSecurityKeysQuery();
const supported = canRegisterSecurityKey();
const removing = ref<SecurityKey | null>(null);
const confirming = ref(false);

function askToRemove(key: SecurityKey) {
  removing.value = key;
  confirming.value = true;
}
</script>

<template>
  <li class="flex flex-col gap-3 border-t border-line py-3.5 first:border-t-0">
    <div class="flex flex-wrap items-center gap-3.5">
      <span
        aria-hidden="true"
        class="flex size-10 shrink-0 items-center justify-center rounded-cell bg-accent-soft text-accent-text"
      >
        <KeyRound class="size-[18px]" />
      </span>
      <span class="flex min-w-0 flex-1 flex-col gap-0.5">
        <strong class="font-semibold">{{ $t('settings.keys.title') }}</strong>
        <span class="text-meta text-muted">{{ $t('settings.keys.description') }}</span>
      </span>
      <AppButton v-if="supported" :disabled="busy" @click="emit('add')">
        {{ $t('settings.keys.add') }}
      </AppButton>
    </div>
    <p v-if="!supported" class="text-meta text-muted">{{ $t('settings.keys.unsupported') }}</p>
    <!-- Beside buttons the viewer can already press: no page-wide loading Bit for the key list. -->
    <QueryState
      :loading="keys.isPending.value"
      :error="keys.error.value"
      :registers-wait="false"
      @retry="keys.refetch()"
    >
      <template #skeleton><SkeletonBlock class="h-[60px] w-full" /></template>
      <EmptyState v-if="!keys.data.value?.length" compact kind="security">
        {{ $t('settings.keys.empty') }}
      </EmptyState>
      <ul v-else class="m-0 flex list-none flex-col gap-2 p-0">
        <li
          v-for="key in keys.data.value"
          :key="key.id"
          data-security-key
          class="flex flex-wrap items-center gap-3 rounded-row border border-line bg-surface-strong px-3.5 py-2.5"
        >
          <span class="flex min-w-0 flex-1 flex-col">
            <strong class="font-semibold break-words">{{ key.name }}</strong>
            <span class="text-meta text-muted">{{ $t('settings.keys.kind') }}</span>
          </span>
          <AppButton
            tone="danger"
            :aria-label="$t('settings.keys.removeLabel', { name: key.name })"
            @click="askToRemove(key)"
          >
            {{ $t('settings.keys.remove') }}
          </AppButton>
        </li>
      </ul>
    </QueryState>
    <RemoveSecurityKeyDialog
      v-model:visible="confirming"
      :security-key="removing"
      @removed="emit('removed', $event)"
    />
  </li>
</template>
