<script setup lang="ts">
import { lookupOrganization } from '@/api/admin-common.api';
import type { OrganizationChip } from '@/api/types/admin-common';
import ExactChips from './ExactChips.vue';
import { shortId } from './short-id';

const chips = defineModel<OrganizationChip[]>({ required: true });
defineProps<{ label: string; max?: number; error?: string; lockedBy?: string }>();
const nameOf = (chip: OrganizationChip) => chip.slug ?? shortId(chip.id);
</script>

<template>
  <ExactChips
    v-model="chips"
    :label="label"
    :lookup="lookupOrganization"
    :name-of="nameOf"
    :is-named="(chip: OrganizationChip) => chip.slug !== null"
    :placeholder="$t('admin.ui.addBySlug')"
    :no-such-text="(name: string) => $t('admin.ui.noSuchOrganization', { name })"
    chip-test-id="organization-chip"
    :max="max"
    :error="error"
    :locked-by="lockedBy"
  />
</template>
