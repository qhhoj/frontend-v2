<script setup lang="ts">
import { computed } from 'vue';
import { useOrganizationQuery } from '@/features/organizations/organizations.queries';
import JoinRequestsPanel from './JoinRequestsPanel.vue';
import MembersPanel from './MembersPanel.vue';

/** The join requests and the members are administrators' views: the backend answers others with 403. */
const props = defineProps<{ slug: string }>();
const detail = useOrganizationQuery(() => props.slug);
const canAdminister = computed(() => detail.data.value?.viewer?.canAdminister === true);
</script>

<template>
  <template v-if="canAdminister">
    <JoinRequestsPanel :key="`requests-${slug}`" :slug="slug" />
    <MembersPanel :key="`members-${slug}`" :slug="slug" />
  </template>
</template>
