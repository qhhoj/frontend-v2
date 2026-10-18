<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import Notice from '@/components/ui/Notice.vue';
import type { CreationKind } from './creation-scope';

/**
 * What the owner picker says when it has nothing to offer. `none`: the viewer may create in organizations but the list came
 * back empty, so the notice says who may create and leads to the organizations; `failed`: the list did not load, retry.
 */
defineProps<{ kind: CreationKind; reason: 'none' | 'failed' }>();
defineEmits<{ retry: [] }>();
</script>

<template>
  <Notice
    v-if="reason === 'none'"
    tone="warning"
    compact
    :title="$t(`admin.creation.owner.none.${kind}.title`)"
    data-testid="creation-owner-none"
  >
    {{ $t(`admin.creation.owner.none.${kind}.body`) }}
    <template #action>
      <AppButton size="sm" class="mt-2" :to="{ name: 'organizations' }">
        {{ $t('admin.creation.owner.none.action') }}
      </AppButton>
    </template>
  </Notice>
  <Notice
    v-else
    tone="danger"
    compact
    :title="$t('admin.creation.owner.failed.title')"
    data-testid="creation-owner-failed"
  >
    {{ $t('admin.creation.owner.failed.body') }}
    <template #action>
      <AppButton size="sm" class="mt-2" @click="$emit('retry')">
        {{ $t('common.retry') }}
      </AppButton>
    </template>
  </Notice>
</template>
