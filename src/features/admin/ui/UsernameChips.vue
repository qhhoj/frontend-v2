<script setup lang="ts">
import { lookupUser, suggestUsers } from '@/api/admin-common.api';
import { usernameProblem } from '@/lib/username';
import type { UserChip } from '@/api/types/admin-common';
import ExactChips from './ExactChips.vue';
import { shortId } from './short-id';

const chips = defineModel<UserChip[]>({ required: true });
defineProps<{ label: string; max?: number; error?: string; lockedBy?: string }>();
/** Only a well-formed prefix is sent; anything else could never match a username. */
const suggest = async (typed: string) => (usernameProblem(typed) ? [] : suggestUsers(typed));
const nameOf = (chip: UserChip) => chip.username ?? shortId(chip.id);
</script>

<template>
  <ExactChips
    v-model="chips"
    :label="label"
    :lookup="lookupUser"
    :suggest="suggest"
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
