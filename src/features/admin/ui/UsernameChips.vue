<script setup lang="ts">
import { lookupUser } from '@/api/admin-common.api';
import type { UserChip } from '@/api/types/admin-common';
import ExactChips from './ExactChips.vue';
import { shortId } from './short-id';

const chips = defineModel<UserChip[]>({ required: true });
defineProps<{ label: string; max?: number; error?: string; lockedBy?: string }>();
const nameOf = (chip: UserChip) => chip.username ?? shortId(chip.id);
</script>

<template>
  <ExactChips
    v-model="chips"
    :label="label"
    :lookup="lookupUser"
    :name-of="nameOf"
    :is-named="(chip: UserChip) => chip.username !== null"
    :placeholder="$t('admin.ui.addByUsername')"
    :no-such-text="(name: string) => $t('admin.ui.noSuchUser', { name })"
    chip-test-id="user-chip"
    :max="max"
    :error="error"
    :locked-by="lockedBy"
  />
</template>
