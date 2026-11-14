<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import Notice from '@/components/ui/Notice.vue';

/** A failed create as one inline line; the link cap also says where to free a slot. */
defineProps<{ messageKey: string }>();
</script>

<template>
  <Notice tone="danger" inline>
    {{ $t(messageKey) }}
    <template v-if="messageKey === 'share.error.share_limit'" #action>
      <AppButton tone="link" :to="{ name: 'settings-shares' }">{{
        $t('share.list.heading')
      }}</AppButton>
    </template>
  </Notice>
</template>
